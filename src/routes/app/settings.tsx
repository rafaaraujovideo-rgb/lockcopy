import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getSupabase } from "@/integrations/supabase/client";
import { useWorkspace, workspaceKey } from "@/lib/workspace";
import { friendlyError } from "@/lib/lockcopy";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Brand settings — Lockcopy" },
      { name: "description", content: "Set the agency name, logo and color your clients see on their portal." },
      { property: "og:title", content: "Brand settings — Lockcopy" },
      { property: "og:description", content: "Set the logo and color your clients see." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const org = ws.data?.org;
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [color, setColor] = useState("#2f3e5c");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setLogo(org.logo_url ?? "");
    setColor(org.brand_color ?? "#2f3e5c");
  }, [org]);

  if (!org) return null;
  const validLogo = /^https:\/\//.test(logo.trim());

  const save = async () => {
    setBusy(true); setMsg(""); setError("");
    try {
      const url = logo.trim();
      if (url && !/^https:\/\//.test(url)) throw new Error("The logo link must start with https://");
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Pick a valid color.");
      if (name.trim().length < 2) throw new Error("The agency name is too short.");
      const { error: err } = await getSupabase().from("organizations").update({ name: name.trim(), logo_url: url || null, brand_color: color }).eq("id", org.id);
      if (err) throw new Error(err.message);
      await qc.invalidateQueries({ queryKey: workspaceKey });
      setMsg("Saved. Your clients see the new brand on their next visit.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">Brand</h1>
          <p className="mt-1 text-sm text-muted-foreground">What your clients see on every request link.</p>
        </div>
        <Card className="space-y-3">
          <label className="block text-sm text-muted-foreground">Agency name<input className={inputClass + " mt-1"} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block text-sm text-muted-foreground">Logo link (https://…)<input className={inputClass + " mt-1"} placeholder="https://yourstudio.com/logo.png" value={logo} onChange={(e) => setLogo(e.target.value)} /></label>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">Brand color<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-border bg-card" aria-label="Brand color" /><span className="font-mono text-xs">{color}</span></label>
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
          {msg && <p className="rounded-md bg-accent p-2 text-sm text-accent-foreground">{msg}</p>}
          <Btn className="w-full" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save brand"}</Btn>
        </Card>
      </div>
      <Card>
        <p className="eyebrow mb-3">Client portal preview</p>
        <div className="rounded-md border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            {validLogo && <img src={logo.trim()} alt={name} className="h-6 max-w-[120px] object-contain" />}
            <p className="text-xs text-muted-foreground">{name || "Your agency"} · for Your client</p>
          </div>
          <p className="mt-4 text-sm font-medium">Home · Main headline</p>
          <div className="mt-2 h-9 rounded-md border border-input bg-card" />
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3" style={{ background: color }} /></div>
          <button type="button" className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-primary-foreground" style={{ background: color }}>Send to agency</button>
        </div>
      </Card>
    </div>
  );
}
