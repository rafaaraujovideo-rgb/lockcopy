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
      { title: "Pedidos — Lockcopy" },
      { name: "description", content: "Acompanhe o progresso dos pedidos de conteúdo dos seus clientes." },
      { property: "og:title", content: "Pedidos — Lockcopy" },
      { property: "og:description", content: "Acompanhe o progresso dos pedidos de conteúdo." },
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
        <Card className="bg-accent text-sm text-accent-foreground">Cartão registado. O teste de 14 dias começa assim que o Stripe confirmar — pode demorar alguns segundos.</Card>
      )}
      {checkout === "cancel" && <Card className="text-sm text-muted-foreground">O registo do cartão foi cancelado. Nada foi cobrado.</Card>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{active} de {limit} pedidos ativos</p>
        </div>
        <Link to="/app/novo" className={btnClass}>Novo pedido</Link>
      </div>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar pedidos…</p>
      ) : q.error ? (
        <Card><p className="text-sm text-destructive">{friendlyError(q.error)}</p></Card>
      ) : !q.data?.length ? (
        <Card className="text-center">
          <p className="font-display text-xl font-semibold">Ainda não há pedidos</p>
          <p className="mt-1 text-sm text-muted-foreground">Escolha um modelo, gere o link e envie-o ao cliente.</p>
          <Link to="/app/novo" className={btnClass + " mt-4"}>Criar o primeiro pedido</Link>
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
                      <p className="text-sm text-muted-foreground">{r.title} · prazo {fmtDate(r.due_date)}</p>
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
