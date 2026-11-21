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
      { title: "Entrar ou criar conta — Lockcopy" },
      { name: "description", content: "Entre na sua conta Lockcopy ou crie a conta da sua agência." },
      { property: "og:title", content: "Entrar ou criar conta — Lockcopy" },
      { property: "og:description", content: "Entre na sua conta Lockcopy ou crie a conta da sua agência." },
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
        if (err) throw new Error(err.message === "Invalid login credentials" ? "Email ou palavra-passe incorretos." : err.message === "Email not confirmed" ? "Confirme primeiro o email que lhe enviámos." : err.message);
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (err) throw err;
        if (!data.session) setInfo("Enviámos um email de confirmação. Abra o link e volte a entrar aqui.");
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
          <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm">
            {(["entrar", "criar"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={"rounded-full py-1.5 " + (mode === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}>
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
          {!hasSupabase ? (
            <p className="text-sm text-muted-foreground">A ligação à conta ainda não está configurada.</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input className={inputClass} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className={inputClass} type="password" autoComplete={mode === "entrar" ? "current-password" : "new-password"} placeholder="Palavra-passe (mín. 8 caracteres)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
              {info && <p className="rounded-md bg-accent p-2 text-sm text-accent-foreground">{info}</p>}
              <Btn className="w-full" disabled={busy} type="submit">{busy ? "Um momento…" : mode === "entrar" ? "Entrar" : "Criar conta"}</Btn>
            </form>
          )}
        </Card>
        <p className="text-center text-xs text-muted-foreground">Os seus clientes nunca precisam de conta: preenchem tudo pelo link.</p>
      </div>
    </div>
  );
}
