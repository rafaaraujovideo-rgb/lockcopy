import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getAdminOverview } from "@/lib/admin.functions";
import { isAdminUser } from "@/lib/admin";
import { useSession } from "@/lib/session";
import { fmtDate } from "@/lib/lockcopy";
import { Card } from "@/components/ui-bits";

export const Route = createFileRoute("/app/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Owner overview — Lockcopy" },
      { name: "description", content: "Agencies, plans and Stripe subscriptions at a glance." },
      { property: "og:title", content: "Owner overview — Lockcopy" },
      { property: "og:description", content: "Agencies, plans and Stripe subscriptions at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const PLAN: Record<string, string> = { teste: "No trial", solo: "Solo", agency: "Agency" };
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function AdminPage() {
  const { session } = useSession();
  const allowed = isAdminUser(session?.user);
  const fetchOverview = useServerFn(getAdminOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview(), enabled: allowed });

  if (!allowed) return <Card><p className="text-sm text-muted-foreground">This page is not available.</p></Card>;
  if (q.isLoading) return <div className="space-y-3"><div className="h-8 w-40 animate-pulse rounded-md bg-muted" /><div className="h-40 animate-pulse rounded-lg border border-border bg-muted/60" /></div>;
  if (q.error || !q.data) return <Card><p className="text-sm text-destructive">Could not load the overview.</p></Card>;

  const { orgs, stripe } = q.data;
  const stats = [
    { label: "Agencies", value: String(orgs.length) },
    { label: "Stripe customers", value: String(orgs.filter((o) => o.stripeCustomer).length) },
    { label: "On trial", value: String(stripe.trialing) },
    { label: "Paying", value: String(stripe.active) },
    { label: "Overdue", value: String(stripe.pastDue) },
    { label: "Monthly revenue (MRR)", value: money(stripe.mrrCents) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">Owner overview</h1>
        <span className="text-xs text-muted-foreground">Stripe: {stripe.live ? "live" : "test mode"}</span>
      </div>
      {stripe.error && <Card><p className="text-sm text-destructive">Stripe: {stripe.error}</p></Card>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 text-2xl font-semibold">{s.value}</p></Card>
        ))}
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Feedback <span className="font-normal text-muted-foreground">· {q.data.feedback.length}</span></h2>
        {q.data.feedback.length === 0 ? (
          <Card><p className="text-sm text-muted-foreground">Nothing yet. Messages sent from the app land here and in your inbox.</p></Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {q.data.feedback.map((f) => (
              <div key={f.id} className="p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border border-border px-1.5 py-0.5 font-medium capitalize text-foreground">{f.kind}</span>
                  {f.email ? <a className="underline" href={`mailto:${f.email}`}>{f.email}</a> : <span>—</span>}
                  <span>· {fmtDate(f.createdAt)}</span>
                  {f.page && <span className="font-mono">· {f.page}</span>}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{f.message}</p>
              </div>
            ))}
          </Card>
        )}
      </section>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="p-3">Agency</th><th className="p-3">Owner</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Trial / renewal</th><th className="p-3">Stripe</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{o.name}</td>
                <td className="p-3">{o.ownerEmail ?? "—"}</td>
                <td className="p-3">{PLAN[o.plan] ?? o.plan}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3">{o.periodEndsAt ? fmtDate(o.periodEndsAt) : o.trialEndsAt ? fmtDate(o.trialEndsAt) : "—"}</td>
                <td className="p-3">
                  {o.stripeCustomer ? (
                    <a className="underline" target="_blank" rel="noreferrer" href={`https://dashboard.stripe.com/${stripe.live ? "" : "test/"}customers/${o.stripeCustomer}`}>Open</a>
                  ) : "—"}
                </td>
                <td className="p-3">{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
