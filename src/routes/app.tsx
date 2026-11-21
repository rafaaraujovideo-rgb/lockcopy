import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useWorkspace, workspaceKey } from "@/lib/workspace";
import { useSession, signOut } from "@/lib/session";
import { getSupabase } from "@/integrations/supabase/client";
import { friendlyError, orgSlug, fmtDate } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { ready, session } = useSession();
  const nav = useNavigate();
  const ws = useWorkspace();

  useEffect(() => {
    if (ready && !session) nav({ to: "/entrar", search: { modo: "entrar", seguir: "/app" } });
  }, [ready, session, nav]);

  const link = "rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground";
  const org = ws.data?.org;
  const planName = org ? { teste: "Teste", solo: "Solo", agency: "Agency" }[org.plan] : "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 text-base font-semibold tracking-tight"><span className="h-2 w-2 rounded-full bg-seal" />Lockcopy</Link>
          {org && (
            <>
              <Link to="/app" activeOptions={{ exact: true }} className={link} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Pedidos</Link>
              <Link to="/app/novo" className={link} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Novo pedido</Link>
              <Link to="/app/faturacao" className={link} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Faturação</Link>
            </>
          )}
          <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            {org && <span>{org.name} · Plano {planName}{org.trial_ends_at ? ` · teste até ${fmtDate(org.trial_ends_at)}` : ""}</span>}
            {session && <button className="underline-offset-2 hover:underline" onClick={() => signOut()}>Sair</button>}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {!ready || !session || ws.isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar…</p>
        ) : ws.error ? (
          <Card><p className="text-sm text-destructive">Não foi possível abrir a conta: {friendlyError(ws.error)}</p></Card>
        ) : !ws.data ? (
          <CreateAgency />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

function CreateAgency() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const suffix = Math.random().toString(36).slice(2, 6);
      const { error: err } = await getSupabase().from("organizations").insert({ name: name.trim(), slug: orgSlug(name, suffix) });
      if (err) throw new Error(err.message);
      await qc.invalidateQueries({ queryKey: workspaceKey });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-3xl font-bold">Como se chama a sua agência?</h1>
      <p className="text-sm text-muted-foreground">Aparece no link que envia aos clientes. Pode mudar depois.</p>
      <Card className="space-y-3">
        <input className={inputClass} placeholder="Ex.: Estúdio Norte" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        <Btn className="w-full" disabled={busy || name.trim().length < 2} onClick={create}>{busy ? "A criar…" : "Criar conta da agência"}</Btn>
      </Card>
    </div>
  );
}
