import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, progress, linkState, PLANS } from "@/lib/store";
import { Badge, btnClass, Card, DemoNote } from "@/components/ui-bits";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Pedidos — Brief" },
      { name: "description", content: "Acompanhe o progresso dos pedidos de conteúdo dos seus clientes." },
      { property: "og:title", content: "Pedidos — Brief" },
      { property: "og:description", content: "Acompanhe o progresso dos pedidos de conteúdo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const requests = useStore((s) => s.requests);
  const plan = useStore((s) => s.plan);
  const active = requests.filter((r) => !r.revoked).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{active} de {PLANS[plan].requests} pedidos ativos</p>
        </div>
        <Link to="/app/novo" className={btnClass}>Novo pedido</Link>
      </div>
      <div className="grid gap-3">
        {requests.map((r) => {
          const p = progress(r);
          return (
            <Link key={r.id} to="/app/pedidos/$id" params={{ id: r.id }}>
              <Card className="transition-colors hover:border-primary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold">{r.client}</p>
                    <p className="text-sm text-muted-foreground">{r.title} · prazo {r.deadline}</p>
                  </div>
                  <Badge s={linkState(r)} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${p.pct}%` }} /></div>
                  <span className="text-xs text-muted-foreground">{p.done}/{p.total}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      <DemoNote />
    </div>
  );
}
