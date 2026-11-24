import { goExternal } from "@/lib/redirect";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { openBillingPortal, startCheckout } from "@/lib/billing.functions";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate, friendlyError } from "@/lib/lockcopy";
import { Btn, Card } from "@/components/ui-bits";

export const Route = createFileRoute("/app/billing")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { checkout?: "ok" | "cancel" } =>
    s["checkout"] === "ok" || s["checkout"] === "cancel" ? { checkout: s["checkout"] } : {},
  head: () => ({
    meta: [
      { title: "Billing — Lockcopy" },
      { name: "description", content: "Plan, trial, next charge and cancellation." },
      { property: "og:title", content: "Billing — Lockcopy" },
      { property: "og:description", content: "Plan, trial, next charge and cancellation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Billing,
});

const STATUS: Record<string, string> = {
  trialing: "on trial",
  active: "active",
  past_due: "payment overdue (7-day grace period)",
  canceled: "cancelled",
  incomplete: "incomplete",
};
const PLAN_NAME: Record<string, string> = { teste: "Trial", solo: "Solo", agency: "Agency" };

function Billing() {
  const ws = useWorkspace();
  const { checkout } = Route.useSearch();
  const [plan, setPlan] = useState<"solo" | "agency">("solo");
  const [cycle, setCycle] = useState<"month" | "year">("month");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const org = ws.data?.org;
  const limits = ws.data?.limits;
  if (!org) return null;
  const hasCard = !!org.current_period_ends_at || org.subscription_status === "active" || org.subscription_status === "past_due";

  const addCard = async () => {
    setBusy(true);
    setError("");
    try {
      const { url } = await startCheckout({ data: { plan, cycle } });
      goExternal(url);
      setBusy(false);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  const manage = async () => {
    setBusy(true);
    setError("");
    try {
      const { url } = await openBillingPortal();
      goExternal(url);
      setBusy(false);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">Billing</h1>
      <Card className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Plan:</span> <b>{PLAN_NAME[org.plan]}</b> · {STATUS[org.subscription_status] ?? org.subscription_status}</p>
        {org.trial_ends_at && !hasCard && <p><span className="text-muted-foreground">Trial until:</span> <b>{fmtDate(org.trial_ends_at)}</b>. No charges until then.</p>}
        {org.current_period_ends_at && <p><span className="text-muted-foreground">Next renewal:</span> {fmtDate(org.current_period_ends_at)}</p>}
        {limits && (
          <p><span className="text-muted-foreground">Limits:</span> {limits.requests_limit} active requests · {limits.users_limit} user(s) · {Math.round(limits.storage_bytes / 1e9)} GB</p>
        )}
        <p><span className="text-muted-foreground">Storage used:</span> {(org.storage_used_bytes / 1e6).toFixed(0)} MB</p>
      </Card>
      {checkout === "ok" && <Card className="bg-accent text-sm text-accent-foreground">Card added. It can take a few seconds for Stripe to confirm.</Card>}
      {checkout === "cancel" && <Card className="text-sm text-muted-foreground">No card was added. Nothing was charged.</Card>}
      {!hasCard ? (
        <Card className="space-y-3">
          <p className="text-sm">Your trial runs without a card. Add one if you want to keep using Lockcopy. You're only charged after the trial ends.</p>
          <div className="flex flex-wrap gap-2 text-sm">
            {(["solo", "agency"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setPlan(k)} className={"rounded-md border px-3 py-1.5 " + (plan === k ? "border-primary bg-primary/5 font-medium" : "border-border")}>{PLAN_NAME[k]}</button>
            ))}
            {(["month", "year"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCycle(c)} className={"rounded-md border px-3 py-1.5 " + (cycle === c ? "border-primary bg-primary/5 font-medium" : "border-border")}>{c === "month" ? "Monthly" : "Yearly"}</button>
            ))}
          </div>
          <Btn disabled={busy} onClick={addCard}>{busy ? "Opening…" : "Add a card"}</Btn>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Card>
      ) : (
        <Card className="space-y-2">
          <Btn variant="outline" disabled={busy} onClick={manage}>{busy ? "Opening…" : "Manage card, invoices or cancel"}</Btn>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Card>
      )}
      <Card className="text-sm text-muted-foreground">
        Failed payment: 7-day grace period without blocking ongoing requests. Cancellation: access until the end of the paid period, with export available.
      </Card>
    </div>
  );
}
