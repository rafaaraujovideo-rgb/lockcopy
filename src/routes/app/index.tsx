import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { listRequests } from "@/lib/api.functions";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate, friendlyError, requestLinkState } from "@/lib/lockcopy";
import { Badge, btnClass, Card } from "@/components/ui-bits";

export const Route = createFileRoute("/app/")({
  validateSearch: (s: Record<string, unknown>): { checkout?: "ok" | "cancel" } =>
    s["checkout"] === "ok" || s["checkout"] === "cancel" ? { checkout: s["checkout"] } : {},
  head: () => ({
    meta: [
      { title: "Requests — Lockcopy" },
      { name: "description", content: "Track the progress of your clients' content requests." },
      { property: "og:title", content: "Requests — Lockcopy" },
      { property: "og:description", content: "Track the progress of content requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { checkout } = Route.useSearch();
  const ws = useWorkspace();
  const q = useQuery({ queryKey: ["requests"], queryFn: () => listRequests() });
  const limit = ws.data?.limits?.requests_limit ?? 1;
  const active = ws.data?.activeRequests ?? 0;

  return (
    <div className="space-y-6">
      {checkout === "ok" && (
        <Card className="bg-accent text-sm text-accent-foreground">Card registered. The 14-day trial starts as soon as Stripe confirms — it can take a few seconds.</Card>
      )}
      {checkout === "cancel" && <Card className="text-sm text-muted-foreground">Card registration was cancelled. Nothing was charged.</Card>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">Requests</h1>
          <p className="text-sm text-muted-foreground">{active} of {limit} active requests</p>
        </div>
        <Link to="/app/novo" className={btnClass}>New request</Link>
      </div>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : q.error ? (
        <Card><p className="text-sm text-destructive">{friendlyError(q.error)}</p></Card>
      ) : !q.data?.length ? (
        <Card className="text-center">
          <p className="font-display text-xl font-semibold">No requests yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Pick a template, generate the link and send it to the client.</p>
          <Link to="/app/novo" className={btnClass + " mt-4"}>Create the first request</Link>
        </Card>
      ) : (
        <div className="grid gap-3">
          {q.data.map((r) => {
            const pct = r.fieldsTotal ? Math.round((r.fieldsDone / r.fieldsTotal) * 100) : 0;
            return (
              <Link key={r.id} to="/app/pedidos/$id" params={{ id: r.id }}>
                <Card className="transition-colors hover:border-primary">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-semibold">{r.client_name}</p>
                      <p className="text-sm text-muted-foreground">{r.title} · due {fmtDate(r.due_date)}</p>
                    </div>
                    <Badge s={requestLinkState(r)} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                    <span className="text-xs text-muted-foreground">{r.fieldsDone}/{r.fieldsTotal}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
