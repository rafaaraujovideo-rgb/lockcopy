import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, actions, progress, linkState, webflowCsv, framerJson, zipManifest, type Field, type Request } from "@/lib/store";
import { Badge, Btn, Card, download, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Rever pedido — Brief" },
      { name: "description", content: "Reveja, aprove e exporte os conteúdos enviados pelo cliente." },
      { property: "og:title", content: "Rever pedido — Brief" },
      { property: "og:description", content: "Reveja, aprove e exporte os conteúdos do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const { id } = Route.useParams();
  const r = useStore((s) => s.requests.find((x) => x.id === id));
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!r) return <p>Pedido não encontrado. <Link to="/app" className="underline">Voltar</Link></p>;
  const p = progress(r);
  const link = `${origin}/c/${r.token}`;
  const ls = linkState(r);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <Link to="/app" className="text-sm text-muted-foreground hover:underline">← Pedidos</Link>
          <h1 className="font-display text-4xl font-bold">{r.client}</h1>
          <p className="text-muted-foreground">{r.title} · {p.done}/{p.total} campos · prazo {r.deadline}</p>
        </div>
        {r.sections.map((s) => (
          <Card key={s.id}>
            <h2 className="mb-2 font-display text-xl font-semibold">{s.page}</h2>
            {s.fields.map((fl) => <FieldReview key={fl.id} r={r} fl={fl} />)}
          </Card>
        ))}
      </div>

      <aside className="space-y-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-medium">Link do cliente</p><Badge s={ls} /></div>
          <p className="break-all rounded bg-muted p-2 text-xs">{link}</p>
          <p className="text-xs text-muted-foreground">Expira a {r.expiresAt}</p>
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1" disabled={ls !== "ativo"} onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? "Copiado" : "Copiar"}</Btn>
            <Link to="/c/$token" params={{ token: r.token }} className="inline-flex flex-1 items-center justify-center rounded-md border border-border text-sm hover:bg-muted">Abrir</Link>
          </div>
          {ls === "ativo" && <Btn variant="ghost" className="w-full text-destructive" onClick={() => actions.revoke(r.id)}>Revogar link</Btn>}
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium">Exportar</p>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client}-estrutura-zip.txt`, zipManifest(r).join("\n") || "(sem ficheiros)", "text/plain")}>ZIP por página</Btn>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client}-webflow.csv`, webflowCsv(r), "text/csv")}>CSV para Webflow</Btn>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client}-framer.json`, framerJson(r), "application/json")}>JSON para Framer</Btn>
          <p className="text-xs text-muted-foreground">Ficheiros preparados para importar, não sincronização. Na demonstração, o ZIP descarrega a estrutura de pastas (original + WebP).</p>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-medium">Histórico</p>
          <ol className="space-y-2 text-xs">
            {[...r.history].reverse().map((h, i) => (
              <li key={i} className="border-l-2 border-primary pl-2"><span className="font-medium">{h.who}</span> — {h.what}</li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}

function FieldReview({ r, fl }: { r: Request; fl: Field }) {
  const a = r.answers[fl.id]!;
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  return (
    <div className="border-t border-border py-3">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{fl.label}</p><Badge s={a.status} /></div>
      {a.text && <p className="mt-1 whitespace-pre-wrap text-sm">{a.text}</p>}
      {a.files.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {a.files.map((x) => <li key={x.name}>📎 {x.name} · {(x.size / 1e6).toFixed(1)} MB · {x.webp === "ok" ? "WebP pronto" : x.webp === "pending" ? "formato por validar, original guardado" : "só original"}</li>)}
        </ul>
      )}
      {a.note && a.status === "ajuste" && <p className="mt-1 text-xs text-destructive">Nota: {a.note}</p>}
      {a.status === "enviado" && !asking && (
        <div className="mt-2 flex gap-2">
          <Btn className="px-3 py-1" onClick={() => actions.review(r.id, fl.id, "aprovado", fl.label)}>Aprovar</Btn>
          <Btn variant="outline" className="px-3 py-1" onClick={() => setAsking(true)}>Pedir ajuste</Btn>
        </div>
      )}
      {asking && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} placeholder="O que falta?" value={note} onChange={(e) => setNote(e.target.value)} />
          <Btn disabled={!note} onClick={() => { actions.review(r.id, fl.id, "ajuste", fl.label, note); setAsking(false); }}>Enviar</Btn>
        </div>
      )}
    </div>
  );
}
