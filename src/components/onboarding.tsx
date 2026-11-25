import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink } from "lucide-react";

import { getSupabase } from "@/lib/supabase-browser";
import { createRequest } from "@/lib/api.functions";
import { workspaceKey } from "@/lib/workspace";
import { friendlyError } from "@/lib/lockcopy";
import { Btn, Card } from "@/components/ui-bits";

type Org = { id: string; name: string; logo_url: string | null; brand_color: string | null };

/** Three-step first run: brand, sample request, open the client portal. */
export function Onboarding({ org, email }: { org: Org; email: string }) {
  const qc = useQueryClient();
  const [logo, setLogo] = useState(org.logo_url ?? "");
  const [color, setColor] = useState(org.brand_color ?? "#2f3e5c");
  const [brandDone, setBrandDone] = useState(Boolean(org.logo_url || org.brand_color));
  const [portal, setPortal] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError("");
    try { await fn(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(""); }
  };

  const [uploading, setUploading] = useState(false);
  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) { setError("Use a PNG, JPG, WebP or SVG file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("The logo must be under 2 MB."); return; }
    setUploading(true);
    try {
      const sb = getSupabase();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${org.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage.from("brand-logos").upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw new Error(upErr.message);
      setLogo(sb.storage.from("brand-logos").getPublicUrl(path).data.publicUrl);
    } catch (e) { setError(friendlyError(e)); } finally { setUploading(false); }
  };

  const saveBrand = () => run("brand", async () => {
    const url = logo.trim();
    if (url && !/^https:\/\//.test(url)) throw new Error("The logo link must start with https://");
    const { error: err } = await getSupabase().from("organizations").update({ logo_url: url || null, brand_color: color }).eq("id", org.id);
    if (err) throw new Error(err.message);
    setBrandDone(true);
    await qc.invalidateQueries({ queryKey: workspaceKey });
  });

  const sample = () => run("sample", async () => {
    const { data: t, error: err } = await getSupabase().from("templates").select("id").eq("is_active", true).order("created_at").limit(1).maybeSingle();
    if (err || !t) throw new Error(err?.message ?? "No template available.");
    const r = await createRequest({ data: { orgId: org.id, templateId: t.id, title: "Sample request", clientName: "Sample client (you)", clientEmail: email } });
    setPortal(r.url);
  });

  const steps = [
    { n: 1, title: "Add your brand", done: brandDone },
    { n: 2, title: "Create a sample request", done: Boolean(portal) },
    { n: 3, title: "Open it as your client", done: opened },
  ];
  const current = steps.find((s) => !s.done)?.n ?? 4;

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="eyebrow">Getting started</p>
        <span className="font-mono text-xs text-muted-foreground">{steps.filter((s) => s.done).length}/3</span>
      </div>
      <ol className="divide-y divide-border">
        {steps.map((s) => (
          <li key={s.n} className="px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs font-medium " + (s.done ? "border-transparent bg-accent text-accent-foreground" : "border-border bg-background")}>
                {s.done ? <Check className="h-3.5 w-3.5" /> : s.n}
              </span>
              <p className={"text-sm font-medium " + (s.done ? "text-muted-foreground" : "")}>{s.title}</p>
            </div>
            {s.n === current && (
              <div className="mt-3 pl-9">
                {s.n === 1 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Your clients see this on the portal, so it feels like your studio, not ours.</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm hover:bg-muted">
                        {logo ? <img src={logo} alt="" className="h-5 max-w-[80px] object-contain" /> : null}
                        <span>{uploading ? "Uploading…" : logo ? "Replace logo" : "Upload logo (optional)"}</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" disabled={uploading} onChange={(e) => { void uploadLogo(e.target.files?.[0]); e.target.value = ""; }} />
                      </label>
                      <label className="flex shrink-0 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm">
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" aria-label="Brand colour" />
                        <span className="font-mono text-xs">{color}</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Btn onClick={saveBrand} disabled={busy === "brand" || uploading}>{busy === "brand" ? "Saving…" : "Save brand"}</Btn>
                      <Btn variant="ghost" onClick={() => setBrandDone(true)}>Skip</Btn>
                    </div>
                  </div>
                )}
                {s.n === 2 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">We create a request from the business-site template, addressed to you. It doesn't count as a real client.</p>
                    <Btn onClick={sample} disabled={busy === "sample"}>{busy === "sample" ? "Creating…" : "Create sample request"}</Btn>
                  </div>
                )}
                {s.n === 3 && portal && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">This is exactly what your client gets: no account, autosave, uploads per field.</p>
                    <a href={portal} target="_blank" rel="noreferrer" onClick={() => { setOpened(true); qc.invalidateQueries({ queryKey: ["requests"] }); }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-btn hover:bg-ink-soft">
                      Open client portal <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
      {error && <p className="mx-5 mb-4 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
    </Card>
  );
}
