import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getSupabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { friendlyError } from "@/lib/lockcopy";
import { workspaceKey } from "@/lib/workspace";
import { Btn, Card, btnClass } from "@/components/ui-bits";

export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Join your team — Lockcopy" },
      { name: "description", content: "Accept your invite to collaborate with your agency on Lockcopy." },
      { property: "og:title", content: "Join your team on Lockcopy" },
      { property: "og:description", content: "Accept your invite to collaborate with your agency on Lockcopy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Join,
});

type Preview = { org_name: string; email: string; expired: boolean; accepted: boolean };

function Join() {
  const { token } = Route.useParams();
  const { session, ready } = useSession() as { session: { user: { email?: string } } | null; ready: boolean };
  const nav = useNavigate();
  const qc = useQueryClient();
  const [info, setInfo] = useState<Preview | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (getSupabase() as unknown as { rpc: (f: string, a: unknown) => any })
      .rpc("invite_preview", { _token: token })
      .then(({ data }: { data: Preview[] | null }) => setInfo(data?.[0] ?? null));
  }, [token]);

  const accept = async () => {
    setBusy(true); setError("");
    const { error: err } = await (getSupabase() as unknown as { rpc: (f: string, a: unknown) => any }).rpc("accept_invite", { _token: token });
    if (err) { setError(friendlyError(err)); setBusy(false); return; }
    await qc.invalidateQueries({ queryKey: workspaceKey });
    nav({ to: "/app" });
  };

  const next = `/join/${token}`;
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <Card className="w-full max-w-sm space-y-4">
        {info === undefined && <div className="h-16 animate-pulse rounded-md bg-muted" />}
        {info === null && <p className="text-sm">This invite link doesn't exist.</p>}
        {info && (info.expired || info.accepted) && <p className="text-sm">This invite has expired or was already used. Ask the agency owner for a new one.</p>}
        {info && !info.expired && !info.accepted && (
          <>
            <div>
              <p className="eyebrow">Team invite</p>
              <h1 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em]">Join {info.org_name} on Lockcopy</h1>
              <p className="mt-1 text-sm text-muted-foreground">Invite for {info.email}</p>
            </div>
            {ready && !session && (
              <div className="flex flex-col gap-2">
                <Link to="/login" search={{ mode: "signup", next }} className={btnClass}>Create account</Link>
                <Link to="/login" search={{ mode: "signin", next }} className="text-center text-sm text-muted-foreground underline underline-offset-4">I already have an account</Link>
              </div>
            )}
            {session && <Btn onClick={accept} disabled={busy} className="w-full">{busy ? "Joining…" : "Accept invite"}</Btn>}
            {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
          </>
        )}
      </Card>
    </div>
  );
}
