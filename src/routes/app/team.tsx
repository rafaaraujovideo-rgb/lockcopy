import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getSupabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { friendlyError } from "@/lib/lockcopy";
import { inviteMember } from "@/lib/team.functions";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/team")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Team — Lockcopy" },
      { name: "description", content: "Invite colleagues to review client content with you on Lockcopy." },
      { property: "og:title", content: "Team — Lockcopy" },
      { property: "og:description", content: "Invite colleagues to your Lockcopy agency." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Team,
});

type Member = { user_id: string; email: string; role: string; created_at: string };
type Invite = { id: string; email: string; token: string; created_at: string; expires_at: string; accepted_at: string | null };

function Team() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const org = ws.data?.org;
  const isOwner = ws.data?.role === "owner";
  const limit = ws.data?.limits?.users_limit ?? 1;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const sb = getSupabase() as unknown as { rpc: (f: string, a: unknown) => any; from: (t: string) => any };
  const team = useQuery({
    queryKey: ["team", org?.id],
    enabled: !!org,
    queryFn: async () => {
      const [{ data: members, error: e1 }, inv] = await Promise.all([
        sb.rpc("list_org_members", { _org: org!.id }),
        isOwner ? sb.from("org_invites").select("id, email, token, created_at, expires_at, accepted_at").eq("org_id", org!.id).is("accepted_at", null).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
      ]);
      if (e1) throw new Error(e1.message);
      return { members: (members ?? []) as Member[], invites: ((inv.data ?? []) as Invite[]).filter((i) => new Date(i.expires_at) > new Date()) };
    },
  });

  if (!org) return null;
  const used = (team.data?.members.length ?? 0) + (team.data?.invites.length ?? 0);
  const full = used >= limit;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setError("");
    try {
      const r = await inviteMember({ data: { orgId: org.id, email } });
      setEmail("");
      setMsg(r.emailed ? `Invite sent to ${email}.` : `Invite created. Send this link: ${r.link}`);
      await qc.invalidateQueries({ queryKey: ["team", org.id] });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    const { error: err } = await sb.from("org_invites").delete().eq("id", id);
    if (err) setError(friendlyError(err));
    await qc.invalidateQueries({ queryKey: ["team", org.id] });
  };

  const remove = async (userId: string) => {
    const { error: err } = await sb.from("org_members").delete().eq("org_id", org.id).eq("user_id", userId);
    if (err) setError(friendlyError(err));
    await qc.invalidateQueries({ queryKey: ["team", org.id] });
  };

  const copy = (token: string) => navigator.clipboard?.writeText(`${window.location.origin}/join/${token}`);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">{used} of {limit} {limit === 1 ? "seat" : "seats"} used on your plan.</p>
      </div>

      {isOwner && (
        <Card className="space-y-3">
          {limit <= 1 ? (
            <p className="text-sm text-muted-foreground">Your plan includes 1 user. <Link to="/app/billing" className="font-medium text-foreground underline underline-offset-4">Switch to Agency</Link> to invite up to 3 people.</p>
          ) : (
            <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
              <input className={inputClass} type="email" placeholder="colleague@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={full} />
              <Btn type="submit" disabled={busy || full}>{busy ? "Sending…" : "Send invite"}</Btn>
            </form>
          )}
          {full && limit > 1 && <p className="text-xs text-muted-foreground">All seats are taken. Remove someone or revoke an invite first.</p>}
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
          {msg && <p className="break-all rounded-md bg-accent p-2 text-sm">{msg}</p>}
        </Card>
      )}

      <Card className="divide-y divide-border p-0">
        {team.isLoading && <div className="m-4 h-10 animate-pulse rounded-md bg-muted" />}
        {team.data?.members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 truncate">{m.email}</span>
            <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{m.role === "owner" ? "Owner" : "Member"}</span>
            {isOwner && m.role !== "owner" && <Btn variant="ghost" onClick={() => remove(m.user_id)}>Remove</Btn>}
          </div>
        ))}
        {team.data?.invites.map((i) => (
          <div key={i.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 truncate text-muted-foreground">{i.email}</span>
            <span className="rounded-md border border-dashed border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">Invited</span>
            <Btn variant="ghost" onClick={() => copy(i.token)}>Copy link</Btn>
            <Btn variant="ghost" onClick={() => revoke(i.id)}>Revoke</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}
