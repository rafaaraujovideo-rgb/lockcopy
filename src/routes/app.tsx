import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useStore, PLANS } from "@/lib/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const plan = useStore((s) => s.plan);
  const trialEnds = useStore((s) => s.trialEnds);
  const nav = "rounded-md px-3 py-1.5 text-sm hover:bg-muted";
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/" className="mr-4 font-display text-xl font-bold">Lock<span className="text-primary">copy</span></Link>
          <Link to="/app" activeOptions={{ exact: true }} className={nav} activeProps={{ className: "bg-muted font-medium" }}>Pedidos</Link>
          <Link to="/app/novo" className={nav} activeProps={{ className: "bg-muted font-medium" }}>Novo pedido</Link>
          <Link to="/app/faturacao" className={nav} activeProps={{ className: "bg-muted font-medium" }}>Faturação</Link>
          <span className="ml-auto text-xs text-muted-foreground">
            Plano {PLANS[plan].name}{trialEnds ? ` · teste até ${trialEnds}` : ""}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8"><Outlet /></main>
    </div>
  );
}
