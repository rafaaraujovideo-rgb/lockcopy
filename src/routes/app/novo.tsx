import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TEMPLATES, actions } from "@/lib/store";
import { Btn, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/novo")({
  head: () => ({
    meta: [
      { title: "Novo pedido — Lockcopy" },
      { name: "description", content: "Crie um pedido de conteúdos a partir de um modelo." },
      { property: "og:title", content: "Novo pedido — Lockcopy" },
      { property: "og:description", content: "Crie um pedido de conteúdos a partir de um modelo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRequest,
});

function NewRequest() {
  const nav = useNavigate();
  const [tpl, setTpl] = useState(TEMPLATES[0]!.id);
  const [form, setForm] = useState({ client: "", clientEmail: "", title: "", deadline: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const t = TEMPLATES.find((x) => x.id === tpl)!;

  const submit = () => {
    const r = actions.createRequest({ ...form, templateId: tpl });
    if ("error" in r) return setError(r.error);
    nav({ to: "/app/pedidos/$id", params: { id: r.id } });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <h1 className="font-display text-4xl font-bold">Novo pedido</h1>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((x) => (
            <button key={x.id} onClick={() => setTpl(x.id)} className={"rounded-md border p-3 text-left text-sm " + (tpl === x.id ? "border-primary bg-primary/5" : "border-border bg-card")}>
              <span className="font-semibold">{x.name}</span><br /><span className="text-muted-foreground">{x.description}</span>
            </button>
          ))}
        </div>
        <Card className="space-y-3">
          <input className={inputClass} placeholder="Nome do cliente" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
          <input className={inputClass} type="email" placeholder="Email do cliente" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
          <input className={inputClass} placeholder="Título do projeto" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="block text-sm text-muted-foreground">Prazo<input className={inputClass + " mt-1"} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error} Os pedidos existentes continuam a receber conteúdos.</p>}
          <Btn className="w-full" disabled={!form.client || !form.title || !/@/.test(form.clientEmail)} onClick={submit}>Criar pedido e gerar link</Btn>
        </Card>
      </div>
      <Card>
        <p className="mb-3 text-sm font-medium text-muted-foreground">O cliente vai preencher</p>
        {t.sections.map((s) => (
          <div key={s.id} className="mb-4">
            <p className="font-display text-lg font-semibold">{s.page}</p>
            <ul className="mt-1 space-y-1 text-sm">
              {s.fields.map((fl) => <li key={fl.id} className="flex justify-between border-b border-border py-1"><span>{fl.label}</span><span className="text-muted-foreground">{fl.type === "files" ? "ficheiros" : "texto"}</span></li>)}
            </ul>
          </div>
        ))}
      </Card>
    </div>
  );
}
