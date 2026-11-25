import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getSupabase } from "@/lib/supabase-browser";
import { createRequest, deleteTemplate, saveTemplate } from "@/lib/api.functions";
import { friendlyError, isFileField } from "@/lib/lockcopy";
import { canCreateRequests, planAlert } from "@/lib/trial";
import { useWorkspace, workspaceKey } from "@/lib/workspace";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/new")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "New request — Lockcopy" },
      { name: "description", content: "Create a content request from a template." },
      { property: "og:title", content: "New request — Lockcopy" },
      { property: "og:description", content: "Create a content request from a template." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewRequest,
});

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  org_id: string | null;
  template_sections: Array<{ id: string; title: string; order_index: number; template_fields: Array<{ id: string; label: string; field_type: string; order_index: number; help_text: string | null; char_limit: number | null }> }>;
};

async function loadTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await getSupabase()
    .from("templates")
    .select("id, name, description, org_id, template_sections(id, title, order_index, template_fields(id, label, field_type, order_index, help_text, char_limit))")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as unknown as TemplateRow[]).sort((a, b) => Number(!!b.org_id) - Number(!!a.org_id));
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
  const [extra, setExtra] = useState<Array<{ label: string; help: string; type: "text" | "textarea" | "image" | "file"; limit?: number }>>([]);
  const [rename, setRename] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState({ label: "", help: "", limit: "", type: "text" as "text" | "textarea" | "image" | "file" });
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const org = useWorkspace().data?.org ?? undefined;
  const list = templates.data ?? [];
  const t = list.find((x) => x.id === tplId) ?? list[0];
  const k = (sec: string, label: string) => `${sec}\u0000${label}`;
  const kept = (t?.template_sections ?? []).reduce((n, s) => n + s.template_fields.filter((f) => !skip.has(k(s.title, f.label))).length, 0) + extra.length;
  const toggle = (sec: string, label: string) => setSkip((prev) => { const n = new Set(prev); const id = k(sec, label); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const addExtra = () => { if (!draft.label.trim()) return; const lim = Number(draft.limit); setExtra([...extra, { label: draft.label.trim(), help: draft.help.trim(), type: draft.type, ...(lim > 0 && (draft.type === "text" || draft.type === "textarea") ? { limit: Math.min(20000, Math.round(lim)) } : {}) }]); setDraft({ ...draft, label: "", help: "", limit: "" }); };
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= extra.length) return; const n = [...extra]; [n[i], n[j]] = [n[j]!, n[i]!]; setExtra(n); };
  const shown = (sec: string, label: string) => rename[k(sec, label)] ?? label;
  const [tplName, setTplName] = useState("");
  const [tplMsg, setTplMsg] = useState("");
  const asType = (x: string): "text" | "textarea" | "image" | "file" => (x === "textarea" || x === "image" || x === "file" ? x : "text");
  const currentSections = () =>
    (t?.template_sections ?? [])
      .map((s) => ({ title: s.title, fields: s.template_fields.filter((f) => !skip.has(k(s.title, f.label))).map((f) => ({ label: (shown(s.title, f.label).trim() || f.label), type: asType(f.field_type), ...(f.help_text ? { help: f.help_text } : {}), ...(f.char_limit ? { limit: f.char_limit } : {}) })) }))
      .concat(extra.length ? [{ title: "Extra questions", fields: extra.map((x) => ({ label: x.label, type: x.type, ...(x.help ? { help: x.help } : {}), ...(x.limit ? { limit: x.limit } : {}) })) }] : [])
      .filter((s) => s.fields.length);
  const saveTpl = async () => {
    if (!org || !tplName.trim()) return;
    setTplMsg("");
    try {
      const r = await saveTemplate({ data: { orgId: org.id, name: tplName.trim(), sections: currentSections() } });
      await qc.invalidateQueries({ queryKey: ["templates"] });
      setTplId(r.id); setSkip(new Set()); setExtra([]); setRename({}); setTplName("");
      setTplMsg("Saved. It's now in your templates.");
    } catch (e) { setTplMsg(friendlyError(e)); }
  };
  const removeTpl = async (id: string) => {
    try {
      await deleteTemplate({ data: { templateId: id } });
      await qc.invalidateQueries({ queryKey: ["templates"] });
      setTplId(null); setSkip(new Set());
    } catch (e) { setTplMsg(friendlyError(e)); }
  };

  const submit = async () => {
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const r = await createRequest({ data: { templateId: t.id, title: form.title, clientName: form.client, clientEmail: form.clientEmail, dueDate: form.deadline, skip: [...skip].map((x) => { const [section = "", label = ""] = x.split("\u0000"); return { section, label }; }), extra, rename: Object.entries(rename).filter(([id, v]) => v.trim() && v.trim() !== id.split("\u0000")[1]).map(([id, v]) => { const [section = "", label = ""] = id.split("\u0000"); return { section, label, to: v.trim() }; }) } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["requests"] }), qc.invalidateQueries({ queryKey: workspaceKey })]);
      nav({ to: "/app/requests/$id", params: { id: r.id } });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  if (templates.isLoading) return <div className="space-y-3"><div className="h-8 w-48 animate-pulse rounded-md bg-muted" /><div className="grid grid-cols-2 gap-2">{[0,1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md border border-border bg-muted/60" />)}</div></div>;
  const alert = planAlert(org);
  if (!canCreateRequests(alert)) return (
    <Card className="mx-auto max-w-lg space-y-3 p-6">
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]">{alert.kind === "expired" ? "Your 14-day trial has ended" : "Your plan is inactive"}</h1>
      <p className="text-sm text-muted-foreground">Choose a plan to start collecting content for new clients. Your open requests, answers and exports stay exactly where they are.</p>
      <Link to="/app/billing" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-btn hover:opacity-90">Choose a plan</Link>
    </Card>
  );
  if (templates.error) return <Card><p className="text-sm text-destructive">{friendlyError(templates.error)}</p></Card>;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">New request</h1>
        <div className="grid grid-cols-2 gap-2">
          {list.map((x) => (
            <div key={x.id} className="relative">
              <button onClick={() => { setTplId(x.id); setSkip(new Set()); setExtra([]); setRename({}); }} className={"h-full w-full rounded-md border p-3 text-left text-sm shadow-card transition-colors " + (t?.id === x.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted")}>
                <span className="font-semibold">{x.name}</span><br /><span className="text-muted-foreground">{x.org_id ? "Your template" : x.description}</span>
              </button>
              {x.org_id && <button onClick={() => { if (window.confirm(`Delete the template "${x.name}"? Requests already created keep their questions.`)) void removeTpl(x.id); }} className="absolute right-2 top-2 text-[11px] text-muted-foreground hover:text-destructive" aria-label={`Delete template ${x.name}`}>Delete</button>}
            </div>
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
        <div className="mb-3 inline-flex rounded-md border border-border p-0.5 text-xs" role="tablist">
          {(["edit", "preview"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={"rounded px-3 py-1 font-medium transition-colors " + (view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{v === "edit" ? "Fields" : "Client preview"}</button>
          ))}
        </div>
        {view === "preview" ? <ClientPreview org={org} client={form.client} title={form.title} deadline={form.deadline} sections={(t?.template_sections ?? []).map((s) => ({ title: s.title, fields: s.template_fields.filter((f) => !skip.has(k(s.title, f.label))).map((f) => ({ label: shown(s.title, f.label), file: isFileField(f.field_type), help: "" })) })).concat(extra.length ? [{ title: "Extra questions", fields: extra.map((x) => ({ label: x.label, file: x.type === "image" || x.type === "file", help: x.help })) }] : []).filter((s) => s.fields.length)} /> : <>
        <div className="mb-3 flex items-baseline justify-between"><p className="eyebrow">The client will fill in</p><span className="font-mono text-xs text-muted-foreground">{kept} fields</span></div>
        <p className="mb-3 text-xs text-muted-foreground">Untick what you don't need, click a question to reword it, or add your own below.</p>
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
                      {off ? <span className="flex-1 text-muted-foreground line-through">{fl.label}</span> : <input aria-label={`Question text for ${fl.label}`} className="flex-1 rounded bg-transparent px-1 py-0.5 outline-none hover:bg-muted focus:bg-muted focus:ring-1 focus:ring-ring" value={shown(s.title, fl.label)} maxLength={200} onClick={(e) => e.preventDefault()} onChange={(e) => setRename({ ...rename, [k(s.title, fl.label)]: e.target.value })} />}
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
                <span className="flex flex-col"><button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[10px] leading-none text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label={`Move ${x.label} up`}>▲</button><button type="button" onClick={() => move(i, 1)} disabled={i === extra.length - 1} className="text-[10px] leading-none text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label={`Move ${x.label} down`}>▼</button></span>
                <span className="flex-1">{x.label}{x.limit && <span className="ml-1 font-mono text-[10px] text-muted-foreground">max {x.limit} chars</span>}{x.help && <span className="block text-xs text-muted-foreground">{x.help}</span>}</span>
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
          <input className={inputClass + " mt-2"} placeholder="Note for the client (optional), e.g. Weekdays and weekends" value={draft.help} maxLength={300} onChange={(e) => setDraft({ ...draft, help: e.target.value })} />
          {(draft.type === "text" || draft.type === "textarea") && <input className={inputClass + " mt-2"} type="number" min={1} max={20000} placeholder="Character limit (optional), e.g. 60" value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: e.target.value })} aria-label="Character limit" />}
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="font-display text-lg font-semibold">Save as your template</p>
          <p className="mb-2 text-xs text-muted-foreground">Keep these questions to reuse with your next client.</p>
          <div className="flex gap-2">
            <input className={inputClass + " flex-1"} placeholder="e.g. Restaurant site" value={tplName} maxLength={80} onChange={(e) => setTplName(e.target.value)} aria-label="Template name" />
            <Btn variant="outline" onClick={saveTpl} disabled={!org || !tplName.trim() || kept === 0}>Save</Btn>
          </div>
          {tplMsg && <p className="mt-2 text-xs text-muted-foreground" role="status">{tplMsg}</p>}
        </div>
        </>}
      </Card>
    </div>
  );
}

type PreviewSection = { title: string; fields: Array<{ label: string; file: boolean; help: string }> };

function ClientPreview({ org, client, title, deadline, sections }: { org: { name: string; logo_url?: string | null; brand_color?: string | null } | undefined; client: string; title: string; deadline: string; sections: PreviewSection[] }) {
  const color = org?.brand_color ?? undefined;
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        {org?.logo_url ? <img src={org.logo_url} alt="" className="h-5 w-auto" /> : <span className="h-5 w-5 rounded" style={{ background: color }} />}
        <span className="text-sm font-semibold">{org?.name ?? "Your agency"}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">lockcopy.com/c/…</span>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Hi {client.trim() || "client"}, please send us</p>
          <p className="font-display text-lg font-semibold">{title.trim() || "Project title"}</p>
          {deadline && <p className="font-mono text-[11px] text-muted-foreground">Due {deadline}</p>}
        </div>
        {sections.length === 0 && <p className="text-sm text-muted-foreground">No questions selected.</p>}
        {sections.map((s) => (
          <div key={s.title} className="space-y-2">
            <p className="text-sm font-semibold">{s.title}</p>
            {s.fields.map((f, i) => (
              <div key={i}>
                <p className="text-xs">{f.label}</p>
                {f.help && <p className="text-[11px] text-muted-foreground">{f.help}</p>}
                <div className={"mt-1 rounded border border-border bg-card " + (f.file ? "border-dashed py-3 text-center text-[11px] text-muted-foreground" : "h-7")}>{f.file ? "Drop files here" : null}</div>
              </div>
            ))}
          </div>
        ))}
        <div className="rounded-md py-2 text-center text-sm font-medium text-primary-foreground" style={{ background: color ?? "var(--primary)" }}>Send to {org?.name ?? "agency"}</div>
      </div>
    </div>
  );
}
