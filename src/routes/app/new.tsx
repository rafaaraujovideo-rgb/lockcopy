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
  const [busy, setBusy] = useState(false);
  const list = templates.data ?? [];
  const t = list.find((x) => x.id === tplId) ?? list[0];

  const submit = async () => {
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const r = await createRequest({ data: { templateId: t.id, title: form.title, clientName: form.client, clientEmail: form.clientEmail, dueDate: form.deadline } });
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
            <button key={x.id} onClick={() => setTplId(x.id)} className={"rounded-md border p-3 text-left text-sm shadow-card transition-colors " + (t?.id === x.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted")}>
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
          <Btn className="w-full" disabled={busy || !t || !form.client.trim() || !form.title.trim() || !/^\S+@\S+\.\S+$/.test(form.clientEmail)} onClick={submit}>{busy ? "Creating…" : "Create request and generate link"}</Btn>
        </Card>
      </div>
      <Card>
        <p className="eyebrow mb-3">The client will fill in</p>
        {t?.template_sections.map((s) => (
          <div key={s.id} className="mb-4">
            <p className="font-display text-lg font-semibold">{s.title}</p>
            <ul className="mt-1 space-y-1 text-sm">
              {s.template_fields.map((fl) => <li key={fl.id} className="flex justify-between border-b border-border py-1"><span>{fl.label}</span><span className="text-muted-foreground">{isFileField(fl.field_type) ? "files" : "text"}</span></li>)}
            </ul>
          </div>
        ))}
      </Card>
    </div>
  );
}
