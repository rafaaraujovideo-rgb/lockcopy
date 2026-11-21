import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useStore, PLANS } from "@/lib/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const plan = useStore((s) => s.plan);
  const trialEnds = useStore((s) => s.trialEnds);
  const nav = "rounded-full px-3 py-1.5 text-sm text-ink-muted hover:text-ink-foreground";
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 font-display text-2xl"><span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-xs text-accent-foreground">◆</span>Lock<em className="-ml-2 text-accent">copy</em></Link>
          <Link to="/app" activeOptions={{ exact: true }} className={nav} activeProps={{ className: "bg-ink-line text-ink-foreground font-medium" }}>Pedidos</Link>
          <Link to="/app/novo" className={nav} activeProps={{ className: "bg-ink-line text-ink-foreground font-medium" }}>Novo pedido</Link>
          <Link to="/app/faturacao" className={nav} activeProps={{ className: "bg-ink-line text-ink-foreground font-medium" }}>Faturação</Link>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-accent">
            Plano {PLANS[plan].name}{trialEnds ? ` · teste até ${trialEnds}` : ""}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8"><Outlet /></main>
    </div>
  );
}
