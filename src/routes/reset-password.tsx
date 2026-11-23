import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { getSupabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Lockcopy" },
      { name: "description", content: "Choose a new password for your Lockcopy account." },
      { property: "og:title", content: "Set a new password — Lockcopy" },
      { property: "og:description", content: "Choose a new password for your Lockcopy account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPassword,
});

function NewPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: err } = await getSupabase().auth.updateUser({ password });
      if (err) throw err;
      nav({ to: "/app" });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <Card className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">You'll be signed in right after.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <input className={inputClass + " pr-16"} type={show ? "text" : "password"} autoComplete="new-password" placeholder="New password (min. 8 characters)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs text-muted-foreground hover:bg-muted">{show ? "Hide" : "Show"}</button>
          </div>
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
          <Btn className="w-full" disabled={busy} type="submit">{busy ? "Saving…" : "Save and continue"}</Btn>
        </form>
      </Card>
    </div>
  );
}
