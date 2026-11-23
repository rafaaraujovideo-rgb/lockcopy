import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getSupabase } from "@/integrations/supabase/client";
import { createRequest } from "@/lib/api.functions";
import { friendlyError, isFileField } from "@/lib/lockcopy";
import { workspaceKey } from "@/lib/workspace";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/new")({
  head: () => ({
    meta: [
      { title: "New request — Lockcopy" },
      { name: "description", content: "Create a content request from a template." },
      { property: "og:title", content: "New request — Lockcopy" },
      { property: "og:description", content: "Create a content request from a template." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRequest,
});

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  template_sections: Array<{ id: string; title: string; order_index: number; template_fields: Array<{ id: string; label: string; field_type: string; order_index: number }> }>;
};

async function loadTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await getSupabase()
    .from("templates")
    .select("id, name, description, template_sections(id, title, order_index, template_fields(id, label, field_type, order_index))")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as TemplateRow[];
  for (const t of rows) {
    t.template_sections.sort((a, b) => a.order_index - b.order_index);
    for (const s of t.template_sections) s.template_fields.sort((a, b) => a.order_index - b.order_index);
  }
  return rows;
}

function NewRequest() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const templates = useQuery({ queryKey: ["templates"], queryFn: loadTemplates, staleTime: 5 * 60_000 });
  const [tplId, setTplId] = useState<string | null>(null);
  const [form, setForm] = useState({ client: "", clientEmail: "", title: "", deadline: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<Array<{ label: string; type: "text" | "textarea" | "image" | "file" }>>([]);
  const [draft, setDraft] = useState({ label: "", type: "text" as "text" | "textarea" | "image" | "file" });
  const [busy, setBusy] = useState(false);
  const list = templates.data ?? [];
  const t = list.find((x) => x.id === tplId) ?? list[0];
  const k = (sec: string, label: string) => `${sec}\u0000${label}`;
  const kept = (t?.template_sections ?? []).reduce((n, s) => n + s.template_fields.filter((f) => !skip.has(k(s.title, f.label))).length, 0) + extra.length;
  const toggle = (sec: string, label: string) => setSkip((prev) => { const n = new Set(prev); const id = k(sec, label); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const addExtra = () => { if (!draft.label.trim()) return; setExtra([...extra, { label: draft.label.trim(), type: draft.type }]); setDraft({ ...draft, label: "" }); };

  const submit = async () => {
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const r = await createRequest({ data: { templateId: t.id, title: form.title, clientName: form.client, clientEmail: form.clientEmail, dueDate: form.deadline, skip: [...skip].map((x) => { const [section = "", label = ""] = x.split("\u0000"); return { section, label }; }), extra } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["requests"] }), qc.invalidateQueries({ queryKey: workspaceKey })]);
      nav({ to: "/app/requests/$id", params: { id: r.id } });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  if (templates.isLoading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded-md bg-muted" /><div className="grid grid-cols-2 gap-2">{[0,1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md border border-border bg-muted/60" />)}</div></div>;
  if (templates.error) return <Card><p className="text-sm text-destructive">{friendlyError(templates.error)}</p></Card>;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">New request</h1>
        <div className="grid grid-cols-2 gap-2">
          {list.map((x) => (
            <button key={x.id} onClick={() => { setTplId(x.id); setSkip(new Set()); }} className={"rounded-md border p-3 text-left text-sm shadow-card transition-colors " + (t?.id === x.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted")}>
              <span className="font-semibold">{x.name}</span><br /><span className="text-muted-foreground">{x.description}</span>
            </button>
          ))}
        </div>
        <Card className="space-y-3">
          <input className={inputClass} placeholder="Client name" value={form.client} maxLength={160} onChange={(e) => setForm({ ...form, client: e.target.value })} />
          <input className={inputClass} type="email" placeholder="Client email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
          <input className={inputClass} placeholder="Project title" value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="block text-sm text-muted-foreground">Deadline<input className={inputClass + " mt-1"} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error} Existing requests keep receiving content.</p>}
          <Btn className="w-full" disabled={busy || !t || !form.client.trim() || !form.title.trim() || !/^\S+@\S+\.\S+$/.test(form.clientEmail) || kept === 0} onClick={submit}>{busy ? "Creating…" : "Create request and generate link"}</Btn>
        </Card>
      </div>
      <Card>
        <div className="mb-3 flex items-baseline justify-between"><p className="eyebrow">The client will fill in</p><span className="font-mono text-xs text-muted-foreground">{kept} fields</span></div>
        <p className="mb-3 text-xs text-muted-foreground">Untick anything you don't need, or add your own questions below.</p>
        {t?.template_sections.map((s) => (
          <div key={s.id} className="mb-4">
            <p className="font-display text-lg font-semibold">{s.title}</p>
            <ul className="mt-1 text-sm">
              {s.template_fields.map((fl) => {
                const off = skip.has(k(s.title, fl.label));
                return (
                  <li key={fl.id} className="border-b border-border">
                    <label className="flex cursor-pointer items-center gap-2 py-1.5">
                      <input type="checkbox" checked={!off} onChange={() => toggle(s.title, fl.label)} className="h-3.5 w-3.5 accent-primary" />
                      <span className={off ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{fl.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{isFileField(fl.field_type) ? "files" : "text"}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="mt-2">
          <p className="font-display text-lg font-semibold">Extra questions</p>
          <ul className="mt-1 text-sm">
            {extra.map((x, i) => (
              <li key={i} className="flex items-center gap-2 border-b border-border py-1.5">
                <span className="flex-1">{x.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{x.type === "image" || x.type === "file" ? "files" : x.type === "textarea" ? "long text" : "text"}</span>
                <button onClick={() => setExtra(extra.filter((_, j) => j !== i))} className="text-xs text-muted-foreground hover:text-destructive" aria-label={`Remove ${x.label}`}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input className={inputClass + " flex-1"} placeholder="e.g. Opening hours" value={draft.label} maxLength={200} onChange={(e) => setDraft({ ...draft, label: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtra(); } }} />
            <select className={inputClass + " w-28"} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as typeof draft.type })} aria-label="Answer type">
              <option value="text">Short text</option><option value="textarea">Long text</option><option value="image">Images</option><option value="file">Files</option>
            </select>
            <Btn onClick={addExtra} disabled={!draft.label.trim() || extra.length >= 30}>Add</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
