import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useWorkspace, workspaceKey } from "@/lib/workspace";
import { useSession, signOut } from "@/lib/session";
import { getSupabase } from "@/integrations/supabase/client";
import { friendlyError, orgSlug, fmtDate } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Agency area — Lockcopy" },
      { name: "description", content: "Manage content requests, review answers and export to your site builder." },
      { property: "og:title", content: "Agency area — Lockcopy" },
      { property: "og:description", content: "Manage content requests, review answers and export to your site builder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { ready, session } = useSession();
  const nav = useNavigate();
  const ws = useWorkspace();

  useEffect(() => {
    if (ready && !session) nav({ to: "/entrar", search: { modo: "entrar", seguir: "/app" } });
  }, [ready, session, nav]);

  const link = "rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground";
  const org = ws.data?.org;
  const planName = org ? { teste: "Trial", solo: "Solo", agency: "Agency" }[org.plan] : "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 text-base font-semibold tracking-tight"><span className="h-2 w-2 rounded-full bg-seal" />Lockcopy</Link>
          {org && (
            <>
              <Link to="/app" activeOptions={{ exact: true }} className={link} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Requests</Link>
              <Link to="/app/novo" className={link} activeProps={{ className: "bg-muted text-foreground font-medium" }}>New request</Link>
              <Link to="/app/faturacao" className={link} activeProps={{ className: "bg-muted text-foreground font-medium" }}>Billing</Link>
            </>
          )}
          <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            {org && <span>{org.name} · {planName} plan{org.trial_ends_at ? ` · trial until ${fmtDate(org.trial_ends_at)}` : ""}</span>}
            {session && <button className="underline-offset-2 hover:underline" onClick={() => signOut()}>Sign out</button>}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {!ready || !session || ws.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : ws.error ? (
          <Card><p className="text-sm text-destructive">Could not open the account: {friendlyError(ws.error)}</p></Card>
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
      <h1 className="font-display text-3xl font-bold">What is your agency called?</h1>
      <p className="text-sm text-muted-foreground">It appears on the link you send to clients. You can change it later.</p>
      <Card className="space-y-3">
        <input className={inputClass} placeholder="E.g. Norte Studio" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        <Btn className="w-full" disabled={busy || name.trim().length < 2} onClick={create}>{busy ? "Creating…" : "Create agency account"}</Btn>
      </Card>
    </div>
  );
}
