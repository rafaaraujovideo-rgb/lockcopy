import { Logo, LogoMark } from "@/components/logo";
import { CreditCard, FilePlus2, Inbox, LogOut, Palette, Plus, Shield, Users } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useWorkspace, workspaceKey } from "@/lib/workspace";
import { useSession, signOut } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";
import { getSupabase } from "@/integrations/supabase/client";
import { friendlyError, orgSlug } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app")({
  staticData: { sitemap: "exclude-subtree" },
  head: () => ({
    meta: [
      { title: "Agency area — Lockcopy" },
      { name: "description", content: "Manage content requests, review answers and export to your site builder." },
      { property: "og:title", content: "Agency area — Lockcopy" },
      { property: "og:description", content: "Manage content requests, review answers and export to your site builder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
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

  const org = ws.data?.org;
  const body = !ready || !session || ws.isLoading ? (
    <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded-md bg-muted" /><div className="h-40 animate-pulse rounded-lg border border-border bg-muted/60" /></div>
  ) : ws.error ? (
    <Card><p className="text-sm text-destructive">Could not open the account: {friendlyError(ws.error)}</p></Card>
  ) : !ws.data ? (
    <CreateAgency />
  ) : (
    <Outlet />
  );

  if (!org) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-border px-5 py-3"><Link to="/"><Logo className="text-[15px]" markClassName="h-6 w-6" /></Link></header>
        <main className="mx-auto max-w-6xl px-5 py-10">{body}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <Crumb />
            <Link to="/app/new" className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-btn hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> New request
            </Link>
          </header>
          <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{body}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

const titles: Record<string, string> = {
  "/app": "Requests",
  "/app/new": "New request",
  "/app/settings": "Brand",
  "/app/team": "Team",
  "/app/billing": "Billing",
  "/app/admin": "Admin",
};

function Crumb() {
  const path = useRouterState({ select: (r) => r.location.pathname.replace(/\/$/, "") || "/app" });
  const title = titles[path] ?? (path.startsWith("/app/requests/") ? "Review" : "");
  const org = useWorkspace().data?.org;
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="truncate text-muted-foreground">{org?.name}</span>
      <span className="text-muted-foreground/50">/</span>
      {path.startsWith("/app/requests/") && <><Link to="/app" className="text-muted-foreground hover:text-foreground">Requests</Link><span className="text-muted-foreground/50">/</span></>}
      <span className="truncate font-medium">{title}</span>
    </nav>
  );
}

function AppSidebar() {
  const { session } = useSession();
  const ws = useWorkspace();
  const org = ws.data?.org;
  const path = useRouterState({ select: (r) => r.location.pathname.replace(/\/$/, "") || "/app" });
  const { setOpenMobile } = useSidebar();
  const planName = org ? { teste: "Trial", solo: "Solo", agency: "Agency" }[org.plan] : "";
  const daysLeft = org?.trial_ends_at ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;
  const active = ws.data?.activeRequests ?? 0;
  const limit = ws.data?.limits?.requests_limit ?? 1;
  const email = session?.user?.email ?? "";

  const work = [
    { to: "/app", label: "Requests", icon: Inbox, on: path === "/app" || path.startsWith("/app/requests/") },
    { to: "/app/new", label: "New request", icon: FilePlus2, on: path === "/app/new" },
  ] as const;
  const workspace = [
    { to: "/app/settings", label: "Brand", icon: Palette, on: path === "/app/settings" },
    { to: "/app/team", label: "Team", icon: Users, on: path === "/app/team" },
    { to: "/app/billing", label: "Billing", icon: CreditCard, on: path === "/app/billing" },
  ] as const;

  const item = (i: { to: string; label: string; icon: typeof Inbox; on: boolean }) => (
    <SidebarMenuItem key={i.to}>
      <SidebarMenuButton asChild isActive={i.on} tooltip={i.label} className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:shadow-card">
        <Link to={i.to} onClick={() => setOpenMobile(false)}><i.icon className="h-4 w-4" /><span>{i.label}</span></Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3 p-3">
        <Link to="/app" className="flex items-center gap-2 overflow-hidden rounded-md px-1 py-1">
          <LogoMark className="h-7 w-7" />
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold leading-tight tracking-[-0.01em]">{org?.name}</span>
            <span className="block font-mono text-[10.5px] text-muted-foreground">{planName} plan</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10.5px] uppercase tracking-wider">Work</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{work.map(item)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10.5px] uppercase tracking-wider">Agency</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspace.map(item)}
              {isAdminUser(session?.user) && item({ to: "/app/admin", label: "Admin", icon: Shield, on: path === "/app/admin" })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 p-3">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-3 shadow-card group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{daysLeft !== null && org?.subscription_status === "trialing" ? `Trial · ${daysLeft} days left` : `${planName} plan`}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-seal" style={{ width: `${Math.min(100, (active / Math.max(1, limit)) * 100)}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-[10.5px] text-muted-foreground">{active} of {limit} active requests</p>
          <Link to="/app/billing" onClick={() => setOpenMobile(false)} className="mt-2 inline-block text-xs font-medium underline-offset-2 hover:underline">Manage plan</Link>
        </div>
        <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sidebar-border bg-sidebar-accent text-[11px] font-semibold uppercase">{email.slice(0, 1)}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{email}</span>
          <button onClick={() => signOut()} title="Sign out" aria-label="Sign out" className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground group-data-[collapsible=icon]:hidden">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
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
