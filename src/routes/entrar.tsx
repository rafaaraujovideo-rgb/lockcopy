import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getSupabase, hasSupabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { friendlyError } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

type Search = { modo?: "entrar" | "criar"; seguir?: string };

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    modo: s["modo"] === "criar" ? "criar" : "entrar",
    seguir: typeof s["seguir"] === "string" && s["seguir"].startsWith("/") ? s["seguir"] : "/app",
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create account — Lockcopy" },
      { name: "description", content: "Sign in to your Lockcopy account or create your agency account." },
      { property: "og:title", content: "Sign in or create account — Lockcopy" },
      { property: "og:description", content: "Sign in to your Lockcopy account or create your agency account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { modo, seguir } = Route.useSearch();
  const nav = useNavigate();
  const { ready, session } = useSession();
  const [mode, setMode] = useState<"entrar" | "criar">(modo ?? "entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const next = seguir ?? "/app";

  useEffect(() => {
    if (ready && session) nav({ to: next });
  }, [ready, session, next, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const supabase = getSupabase();
      if (mode === "entrar") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message === "Email not confirmed" ? "Please confirm the email we sent you first." : err.message);
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (err) throw err;
        if (!data.session) setInfo("We sent you a confirmation email. Open the link and sign in here again.");
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-5">
        <Link to="/" className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-seal" />Lockcopy
        </Link>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-muted p-1 text-sm">
            {(["entrar", "criar"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={"rounded py-1.5 " + (mode === m ? "bg-card font-medium shadow-card" : "text-muted-foreground")}>
                {m === "entrar" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          {!hasSupabase ? (
            <p className="text-sm text-muted-foreground">The account connection is not configured yet.</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input className={inputClass} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className={inputClass} type="password" autoComplete={mode === "entrar" ? "current-password" : "new-password"} placeholder="Password (min. 8 characters)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
              {info && <p className="rounded-md bg-accent p-2 text-sm text-accent-foreground">{info}</p>}
              <Btn className="w-full" disabled={busy} type="submit">{busy ? "One moment…" : mode === "entrar" ? "Sign in" : "Create account"}</Btn>
            </form>
          )}
        </Card>
        <p className="text-center text-xs text-muted-foreground">Your clients never need an account: they fill everything in through the link.</p>
      </div>
    </div>
  );
}
