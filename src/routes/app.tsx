import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useStore, PLANS } from "@/lib/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const plan = useStore((s) => s.plan);
  const trialEnds = useStore((s) => s.trialEnds);
  const nav = "rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground";
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 text-base font-semibold tracking-tight"><span className="h-2 w-2 rounded-full bg-seal" />Lockcopy</Link>
          <Link to="/app" activeOptions={{ exact: true }} className={nav} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Pedidos</Link>
          <Link to="/app/novo" className={nav} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Novo pedido</Link>
          <Link to="/app/faturacao" className={nav} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Faturação</Link>
          <span className="ml-auto text-xs text-muted-foreground">
            Plano {PLANS[plan].name}{trialEnds ? ` · teste até ${trialEnds}` : ""}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8"><Outlet /></main>
    </div>
  );
}
