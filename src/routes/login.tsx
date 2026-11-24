import { Logo } from "@/components/logo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getSupabase, hasSupabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { friendlyError, orgSlug } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

type Search = { mode?: "signin" | "signup"; next?: string };

export const Route = createFileRoute("/login")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "signup" ? "signup" : "signin",
    next: typeof s["next"] === "string" && s["next"].startsWith("/") ? s["next"] : "/app",
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
    links: [{ rel: "canonical", href: "https://lockcopy.com/login" }],
  }),
  component: SignIn,
});

function SignIn() {
  const { mode: initialMode, next: nextParam } = Route.useSearch();
  const nav = useNavigate();
  const { ready, session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [show, setShow] = useState(false);
  const [agency, setAgency] = useState("");
  const [forgot, setForgot] = useState(false);
  const next = nextParam ?? "/app";
  const joining = next.startsWith("/join/");

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
      if (forgot) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (err) throw err;
        setInfo("If an account exists for this email, a reset link is on its way.");
      } else if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message === "Email not confirmed" ? "Please confirm the email we sent you first." : err.message);
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (err) throw err;
        const name = agency.trim();
        if (!joining && name.length >= 2) {
          if (data.session) {
            await supabase.from("organizations").insert({ name, slug: orgSlug(name, Math.random().toString(36).slice(2, 6)) });
          } else {
            try { localStorage.setItem("lc_pending_agency", name); } catch { /* ignore */ }
          }
        }
        if (!data.session) setInfo("We sent you a confirmation email. Open the link and sign in here again.");
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    const { error: err } = await getSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}` } });
    if (err) setError(err.message.includes("not enabled") ? "Google sign-in isn't switched on yet. Use email for now." : friendlyError(err));
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between border-r border-border bg-muted/50 p-10 lg:flex">
        <Link to="/" ><Logo className="text-[15px]" markClassName="h-6 w-6" /></Link>
        <div className="max-w-md">
          <p className="eyebrow">For web agencies</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Every page's content, approved, before you start building.</h2>
          <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
            {["One link per client, no sign-up for them", "Autosave, uploads per field, WebP conversion", "Approve or request changes field by field", "Export to Webflow CSV, Framer JSON or ZIP"].map((x) => (
              <li key={x} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-seal" />{x}</li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">14-day trial · no credit card required · cancel anytime</p>
      </aside>
      <div className="flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-5">
        <Link to="/" className="flex items-center justify-center gap-2 lg:hidden text-lg font-semibold tracking-tight">
          <Logo className="text-base" markClassName="h-6 w-6" />
        </Link>
        <h1 className="text-center text-xl font-bold tracking-tight">{forgot ? "Reset your Lockcopy password" : mode === "signin" ? "Sign in to Lockcopy" : "Create your Lockcopy account"}</h1>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-muted p-1 text-sm">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setForgot(false); setError(""); setInfo(""); }} className={"rounded py-1.5 " + (mode === m ? "bg-card font-medium shadow-card" : "text-muted-foreground")}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          {!hasSupabase ? (
            <p className="text-sm text-muted-foreground">The account connection is not configured yet.</p>
          ) : (
            <div className="space-y-3">
              {!forgot && (
                <>
                  <button type="button" onClick={google} className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                    Continue with Google
                  </button>
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
                </>
              )}
              <form onSubmit={submit} className="space-y-3">
                {mode === "signup" && !forgot && !joining && (
                  <input className={inputClass} placeholder="Agency name (e.g. Norte Studio)" value={agency} maxLength={120} onChange={(e) => setAgency(e.target.value)} required minLength={2} />
                )}
                <input className={inputClass} type="email" autoComplete="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {!forgot && (
                  <div className="relative">
                    <input className={inputClass + " pr-16"} type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signup" ? "Password (min. 8 characters)" : "Password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-muted-foreground hover:bg-muted" aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
                  </div>
                )}
                {mode === "signin" && (
                  <button type="button" onClick={() => { setForgot((v) => !v); setError(""); setInfo(""); }} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                    {forgot ? "← Back to sign in" : "Forgot password?"}
                  </button>
                )}
                {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
                {info && <p className="rounded-md bg-accent p-2 text-sm text-accent-foreground">{info}</p>}
                <Btn className="w-full" disabled={busy} type="submit">{busy ? "One moment…" : forgot ? "Send reset link" : mode === "signin" ? "Sign in" : "Create account"}</Btn>
              </form>
            </div>
          )}
        </Card>
        <p className="text-center text-xs text-muted-foreground">Your clients never need an account: they fill everything in through the link.</p>
      </div>
      </div>
    </div>
  );
}
