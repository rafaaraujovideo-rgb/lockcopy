import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { listRequests, setArchived } from "@/lib/api.functions";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate, friendlyError, requestLinkState } from "@/lib/lockcopy";
import { Badge, btnClass, Card, inputClass } from "@/components/ui-bits";
import { Onboarding } from "@/components/onboarding";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/app/")({
  staticData: { sitemap: false },
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
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const all = q.data ?? [];
  const term = search.trim().toLowerCase();
  const rows = all.filter((r) => tabMatch(tab, r) && (!term || `${r.client_name} ${r.title} ${r.client_email ?? ""}`.toLowerCase().includes(term)));
  const toggleArchive = async (e: React.MouseEvent, id: string, archived: boolean) => {
    e.preventDefault(); e.stopPropagation();
    await setArchived({ data: { requestId: id, archived } });
    await Promise.all([qc.invalidateQueries({ queryKey: ["requests"] }), qc.invalidateQueries({ queryKey: ["workspace"] })]);
  };

  return (
    <div className="space-y-6">
      {checkout === "ok" && (
        <Card className="bg-accent text-sm text-accent-foreground">Plan saved. It can take a few seconds to show up here.</Card>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input className={inputClass + " sm:max-w-xs"} type="search" placeholder="Search client or request" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search requests" />
            <div className="flex flex-wrap gap-1" role="tablist">
              {TABS.map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-md px-2.5 py-1 text-xs transition-colors ${tab === k ? "bg-card font-medium text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}>
                  {label} <span className="font-mono tabular-nums opacity-60">{all.filter((r) => tabMatch(k, r)).length}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-window">
            {rows.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No requests match.</p>}
            <div className="hidden grid-cols-[1fr_9rem_10rem_7rem] gap-4 border-b border-border bg-muted/50 px-4 py-2 sm:grid">
              <span className="eyebrow">Client</span><span className="eyebrow">Due</span><span className="eyebrow">Progress</span><span className="eyebrow text-right">Status</span>
            </div>
            {rows.map((r) => {
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
                  <span className="row-start-1 col-start-2 flex items-center gap-2 justify-self-end sm:row-auto sm:col-auto">
                    <button onClick={(e) => toggleArchive(e, r.id, r.status !== "archived")} className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-100 hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100">{r.status === "archived" ? "Restore" : "Archive"}</button>
                    <Badge s={requestLinkState(r)} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type Tab = "all" | "waiting" | "review" | "approved" | "archived";
type Row = { status: string; fieldsDone: number; fieldsTotal: number };
const TABS: Array<[Tab, string]> = [["all", "Open"], ["waiting", "Waiting on client"], ["review", "To review"], ["approved", "Approved"], ["archived", "Archived"]];
function tabMatch(t: Tab, r: Row) {
  if (t === "archived") return r.status === "archived";
  if (r.status === "archived") return false;
  if (t === "waiting") return (r.status === "sent" || r.status === "in_progress") && r.fieldsDone < r.fieldsTotal;
  if (t === "review") return r.fieldsTotal > 0 && r.fieldsDone === r.fieldsTotal && r.status !== "completed";
  if (t === "approved") return r.status === "completed";
  return true;
}
