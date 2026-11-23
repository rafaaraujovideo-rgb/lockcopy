import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { listRequests } from "@/lib/api.functions";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate, friendlyError, requestLinkState } from "@/lib/lockcopy";
import { Badge, btnClass, Card } from "@/components/ui-bits";
import { Onboarding } from "@/components/onboarding";
import { useSession } from "@/lib/session";

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
  const { session } = useSession();
  const q = useQuery({ queryKey: ["requests"], queryFn: () => listRequests() });
  const limit = ws.data?.limits?.requests_limit ?? 1;
  const active = ws.data?.activeRequests ?? 0;

  return (
    <div className="space-y-6">
      {checkout === "ok" && (
        <Card className="bg-accent text-sm text-accent-foreground">Trial started. Your 14 days begin as soon as Stripe confirms — it can take a few seconds.</Card>
      )}
      {checkout === "cancel" && <Card className="text-sm text-muted-foreground">Trial setup was cancelled. Nothing was charged.</Card>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">Requests</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{active} / {limit} active requests on your plan</p>
        </div>
        <Link to="/app/new" className={btnClass}>New request</Link>
      </div>
      {q.isLoading ? (
        <div className="space-y-2">{[0,1,2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-muted/60" />)}</div>
      ) : q.error ? (
        <Card><p className="text-sm text-destructive">{friendlyError(q.error)}</p></Card>
      ) : !q.data?.length && ws.data?.org ? (
        <Onboarding org={ws.data.org} email={session?.user.email ?? ""} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-card sm:grid-cols-4">
            {[
              ["Active", active],
              ["Waiting on client", (q.data ?? []).filter((r) => (r.status === "sent" || r.status === "in_progress") && r.fieldsDone < r.fieldsTotal).length],
              ["To review", (q.data ?? []).filter((r) => r.fieldsTotal > 0 && r.fieldsDone === r.fieldsTotal && r.status !== "completed").length],
              ["Approved", (q.data ?? []).filter((r) => r.status === "completed").length],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-card px-4 py-3">
                <p className="eyebrow">{k}</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">{v}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-window">
            <div className="hidden grid-cols-[1fr_9rem_10rem_7rem] gap-4 border-b border-border bg-muted/50 px-4 py-2 sm:grid">
              <span className="eyebrow">Client</span><span className="eyebrow">Due</span><span className="eyebrow">Progress</span><span className="eyebrow text-right">Status</span>
            </div>
            {(q.data ?? []).map((r) => {
              const pct = r.fieldsTotal ? Math.round((r.fieldsDone / r.fieldsTotal) * 100) : 0;
              return (
                <Link key={r.id} to="/app/requests/$id" params={{ id: r.id }} className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60 sm:grid-cols-[1fr_9rem_10rem_7rem]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-tight">{r.client_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.title}</p>
                  </div>
                  <span className="hidden font-mono text-xs text-muted-foreground sm:block">{fmtDate(r.due_date)}</span>
                  <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{r.fieldsDone}/{r.fieldsTotal}</span>
                  </div>
                  <span className="row-start-1 col-start-2 justify-self-end sm:row-auto sm:col-auto"><Badge s={requestLinkState(r)} /></span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
