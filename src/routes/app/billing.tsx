import { goExternal } from "@/lib/redirect";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { openBillingPortal } from "@/lib/billing.functions";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate, friendlyError } from "@/lib/lockcopy";
import { Btn, btnClass, Card } from "@/components/ui-bits";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Lockcopy" },
      { name: "description", content: "Plan, trial, next charge and cancellation." },
      { property: "og:title", content: "Billing — Lockcopy" },
      { property: "og:description", content: "Plan, trial, next charge and cancellation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const org = ws.data?.org;
  const limits = ws.data?.limits;
  if (!org) return null;
  const hasCard = !!org.trial_ends_at || org.plan !== "teste";

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
      <h1 className="font-display text-4xl font-bold">Billing</h1>
      <Card className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Plan:</span> <b>{PLAN_NAME[org.plan]}</b> · {STATUS[org.subscription_status] ?? org.subscription_status}</p>
        {org.trial_ends_at && <p><span className="text-muted-foreground">Trial until:</span> <b>{fmtDate(org.trial_ends_at)}</b> — no charges until then</p>}
        {org.current_period_ends_at && <p><span className="text-muted-foreground">Next renewal:</span> {fmtDate(org.current_period_ends_at)}</p>}
        {limits && (
          <p><span className="text-muted-foreground">Limits:</span> {limits.requests_limit} active requests · {limits.users_limit} user(s) · {Math.round(limits.storage_bytes / 1e9)} GB</p>
        )}
        <p><span className="text-muted-foreground">Storage used:</span> {(org.storage_used_bytes / 1e6).toFixed(0)} MB</p>
      </Card>
      {!hasCard ? (
        <Card>
          <p className="text-sm">You haven't registered a card yet. The 14-day trial starts when you do.</p>
          <Link to="/start" className={btnClass + " mt-3"}>Register card and start 14 days</Link>
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
