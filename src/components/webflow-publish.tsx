import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase-browser";
import { friendlyError } from "@/lib/lockcopy";
import type { ExportInput } from "@/lib/exports";
import { buildWebflowItems, type WfField } from "@/lib/webflow";
import { webflowCollections, webflowFields, webflowPublish } from "@/lib/webflow.functions";
import { Btn, inputClass } from "@/components/ui-bits";

const KEY = "lockcopy.webflowToken";

export function WebflowPublish({ exp, approved }: { exp: ExportInput; approved: Set<string> }) {
  const [token, setToken] = useState("");
  const [cols, setCols] = useState<Array<{ id: string; name: string; site: string }>>([]);
  const [col, setCol] = useState("");
  const [fields, setFields] = useState<WfField[]>([]);
  const [busy, setBusy] = useState("");
  useEffect(() => setToken(localStorage.getItem(KEY) ?? ""), []);

  const go = async (k: string, fn: () => Promise<void>) => {
    setBusy(k);
    try { await fn(); } catch (e) { toast.error(friendlyError(e)); } finally { setBusy(""); }
  };
  const connect = () => go("c", async () => {
    localStorage.setItem(KEY, token.trim());
    const list = await webflowCollections({ data: { token: token.trim() } });
    if (!list.length) throw new Error("No CMS collections found on this token's site.");
    setCols(list);
  });
  const pick = (id: string) => { setCol(id); setFields([]); if (id) void go("f", async () => setFields(await webflowFields({ data: { token: token.trim(), collectionId: id } }))); };

  const preview = fields.length ? buildWebflowItems(exp, fields, approved) : [];
  const anyMatch = preview.some((p) => p.matched.length);

  const publish = () => go("p", async () => {
    const urls: Record<string, string[]> = {};
    for (const f of exp.files) {
      if (!approved.has(f.field_id)) continue;
      const { data } = await getSupabase().storage.from("client-uploads").createSignedUrl(f.webp_storage_path ?? f.storage_path, 600);
      if (data?.signedUrl) (urls[f.field_id] ??= []).push(data.signedUrl);
    }
    const items = buildWebflowItems(exp, fields, approved, urls).filter((i) => i.matched.length).map((i) => i.fieldData);
    if (!items.length) throw new Error("No approved answers match this collection's fields.");
    const r = await webflowPublish({ data: { token: token.trim(), collectionId: col, items } });
    toast.success(`${r.created} draft item${r.created === 1 ? "" : "s"} created in Webflow.`);
  });

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-sm font-medium">Send to Webflow CMS</p>
      {!cols.length ? (
        <>
          <input className={inputClass} type="password" placeholder="Webflow site API token" value={token} onChange={(e) => setToken(e.target.value)} />
          <Btn variant="outline" className="w-full" disabled={!!busy || token.trim().length < 20} onClick={connect}>{busy === "c" ? "Connecting…" : "Connect"}</Btn>
          <p className="text-xs text-muted-foreground">In Webflow: Site settings → Apps & integrations → API access. Give it CMS read and write. The token stays in this browser.</p>
        </>
      ) : (
        <>
          <select className={inputClass} value={col} onChange={(e) => pick(e.target.value)}>
            <option value="">Choose a collection</option>
            {cols.map((c) => <option key={c.id} value={c.id}>{c.site} · {c.name}</option>)}
          </select>
          {busy === "f" && <p className="text-xs text-muted-foreground">Loading fields…</p>}
          {fields.length > 0 && (
            <ul className="space-y-1 text-xs">
              {preview.map((p) => <li key={p.page}><span className="font-medium">{p.page}</span>: <span className="text-muted-foreground">{p.matched.length ? p.matched.join(", ") : "no matching approved fields"}</span></li>)}
            </ul>
          )}
          {fields.length > 0 && !anyMatch && <p className="text-xs text-muted-foreground">Fields are matched by name. Rename a Webflow field to match a question label, or approve more answers.</p>}
          <Btn className="w-full" disabled={!!busy || !anyMatch} onClick={publish}>{busy === "p" ? "Sending…" : "Create drafts in Webflow"}</Btn>
          <button className="text-xs text-muted-foreground hover:underline" onClick={() => { setCols([]); setCol(""); setFields([]); }}>Change token</button>
        </>
      )}
    </div>
  );
}
