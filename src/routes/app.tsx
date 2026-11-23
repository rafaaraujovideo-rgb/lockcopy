import { Logo } from "@/components/logo";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useWorkspace, workspaceKey } from "@/lib/workspace";
import { useSession, signOut } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
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
    if (ready && !session) nav({ to: "/login", search: { mode: "signin", next: "/app" } });
  }, [ready, session, nav]);

  const link = "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  const org = ws.data?.org;
  const planName = org ? { teste: "Trial", solo: "Solo", agency: "Agency" }[org.plan] : "";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
          <Link to="/" className="mr-5"><Logo className="text-[15px]" markClassName="h-6 w-6" /></Link>
          {org && (
            <>
              <Link to="/app" activeOptions={{ exact: true }} className={link} activeProps={{ className: "bg-card text-foreground font-medium shadow-card" }}>Requests</Link>
              <Link to="/app/new" className={link} activeProps={{ className: "bg-card text-foreground font-medium shadow-card" }}>New request</Link>
              <Link to="/app/settings" className={link} activeProps={{ className: "bg-card text-foreground font-medium shadow-card" }}>Brand</Link>
              <Link to="/app/billing" className={link} activeProps={{ className: "bg-card text-foreground font-medium shadow-card" }}>Billing</Link>
              {isAdminUser(session?.user) && <Link to="/app/admin" className={link} activeProps={{ className: "bg-card text-foreground font-medium shadow-card" }}>Admin</Link>}
            </>
          )}
          <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            {org && <span className="hidden rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] sm:inline">{org.name} · {planName} plan{org.trial_ends_at ? ` · trial until ${fmtDate(org.trial_ends_at)}` : ""}</span>}
            {session && <button className="underline-offset-2 hover:underline" onClick={() => signOut()}>Sign out</button>}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        {!ready || !session || ws.isLoading ? (
          <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded-md bg-muted" /><div className="h-40 animate-pulse rounded-lg border border-border bg-muted/60" /></div>
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
  useEffect(() => {
    try { const n = localStorage.getItem("lc_pending_agency"); if (n) setName(n); } catch { /* ignore */ }
  }, []);

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const suffix = Math.random().toString(36).slice(2, 6);
      const { error: err } = await getSupabase().from("organizations").insert({ name: name.trim(), slug: orgSlug(name, suffix) });
      if (err) throw new Error(err.message);
      try { localStorage.removeItem("lc_pending_agency"); } catch { /* ignore */ }
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
