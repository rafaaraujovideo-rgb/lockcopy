import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getSupabase } from "@/integrations/supabase/client";
import { getRequestDetail, reviewField, sendReminder, setRequestLink } from "@/lib/api.functions";
import { answerLabel, eventText, fmtDate, fmtMb, friendlyError, isFileField, requestLinkState } from "@/lib/lockcopy";
import { framerJson, webflowCsv, zipEntries, type ExportInput } from "@/lib/exports";
import { workspaceKey } from "@/lib/workspace";
import { Badge, Btn, Card, download, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Rever pedido — Lockcopy" },
      { name: "description", content: "Reveja, aprove e exporte os conteúdos enviados pelo cliente." },
      { property: "og:title", content: "Rever pedido — Lockcopy" },
      { property: "og:description", content: "Reveja, aprove e exporte os conteúdos do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestPage,
});

type Detail = Awaited<ReturnType<typeof getRequestDetail>>;

const BUCKET = "client-uploads";

async function signedUrl(path: string) {
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(path, 600);
  if (error || !data) throw new Error(error?.message ?? "Ficheiro indisponível.");
  return data.signedUrl;
}

function RequestPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["request", id], queryFn: () => getRequestDetail({ data: { requestId: id } }) });
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const d = q.data;
  const exp = useMemo<ExportInput | null>(() => (d ? toExport(d) : null), [d]);

  if (q.isLoading) return <p className="text-sm text-muted-foreground">A carregar pedido…</p>;
  if (q.error || !d || !exp) return <p>{q.error ? friendlyError(q.error) : "Pedido não encontrado."} <Link to="/app" className="underline">Voltar</Link></p>;

  const r = d.request;
  const subs = new Map(d.submissions.map((s) => [s.field_id, s]));
  const total = d.fields.length;
  const done = d.submissions.filter((s) => s.status === "submitted" || s.status === "approved").length;
  const link = `${origin}/c/${r.token}`;
  const ls = requestLinkState(r);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["request", id] }), qc.invalidateQueries({ queryKey: ["requests"] }), qc.invalidateQueries({ queryKey: workspaceKey })]);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    setMsg("");
    try {
      await fn();
      if (ok) setMsg(ok);
      await refresh();
    } catch (e) {
      setMsg(friendlyError(e));
    } finally {
      setBusy("");
    }
  };

  const zip = () =>
    run("zip", async () => {
      const entries = zipEntries(exp);
      if (!entries.length) throw new Error("Ainda não há ficheiros neste pedido.");
      const { zipSync } = await import("fflate");
      const files: Record<string, Uint8Array> = {};
      for (const e of entries) {
        const res = await fetch(await signedUrl(e.storagePath));
        if (!res.ok) throw new Error(`Não foi possível descarregar ${e.zipPath}.`);
        files[e.zipPath] = new Uint8Array(await res.arrayBuffer());
      }
      const blob = new Blob([zipSync(files, { level: 0 }) as Uint8Array<ArrayBuffer>], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${r.client_name}-conteudos.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <Link to="/app" className="text-sm text-muted-foreground hover:underline">← Pedidos</Link>
          <h1 className="font-display text-4xl font-bold">{r.client_name}</h1>
          <p className="text-muted-foreground">{r.title} · {done}/{total} campos · prazo {fmtDate(r.due_date)}</p>
        </div>
        {d.sections.map((s) => (
          <Card key={s.id}>
            <h2 className="mb-2 font-display text-xl font-semibold">{s.title}</h2>
            {d.fields.filter((f) => f.section_id === s.id).map((f) => (
              <FieldReview key={f.id} field={f} sub={subs.get(f.id)} files={d.files.filter((x) => x.field_id === f.id)} onDone={refresh} />
            ))}
          </Card>
        ))}
      </div>

      <aside className="space-y-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-medium">Link do cliente</p><Badge s={ls} /></div>
          <p className="break-all rounded bg-muted p-2 text-xs">{link}</p>
          <p className="text-xs text-muted-foreground">Expira a {fmtDate(r.expires_at)}</p>
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1" disabled={ls !== "ativo"} onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? "Copiado" : "Copiar"}</Btn>
            <a href={`/c/${r.token}`} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center rounded-full border border-border text-sm hover:bg-muted">Abrir</a>
          </div>
          {ls === "ativo" ? (
            <>
              <Btn variant="outline" className="w-full" disabled={!!busy} onClick={() => run("rem", () => sendReminder({ data: { requestId: r.id } }), "Lembrete posto na fila de envio.")}>Enviar lembrete</Btn>
              <Btn variant="ghost" className="w-full text-destructive" disabled={!!busy} onClick={() => run("link", () => setRequestLink({ data: { requestId: r.id, revoke: true } }), "Link desligado.")}>Desligar link</Btn>
            </>
          ) : (
            <Btn variant="outline" className="w-full" disabled={!!busy} onClick={() => run("link", () => setRequestLink({ data: { requestId: r.id, revoke: false } }), "Link reativado.")}>Reativar link</Btn>
          )}
          {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium">Exportar</p>
          <Btn variant="outline" className="w-full" disabled={!!busy} onClick={zip}>{busy === "zip" ? "A preparar ZIP…" : "ZIP por página"}</Btn>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client_name}-webflow.csv`, webflowCsv(exp), "text/csv")}>CSV para Webflow</Btn>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client_name}-framer.json`, framerJson(exp), "application/json")}>JSON para Framer</Btn>
          <p className="text-xs text-muted-foreground">Ficheiros prontos para importar, organizados por página. Não é sincronização.</p>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-medium">Histórico</p>
          <ol className="space-y-2 text-xs">
            {d.events.slice(0, 50).map((e) => (
              <li key={e.id} className="border-l-2 border-primary pl-2">
                <span className="font-medium">{e.actor === "client" ? "Cliente" : e.actor === "agency" ? "Agência" : "Sistema"}</span> — {eventText(e.kind, e.detail)}
                <span className="block text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-PT")}</span>
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}

function toExport(d: Detail): ExportInput {
  return {
    title: d.request.title,
    client: d.request.client_name,
    sections: d.sections.map((s) => ({ id: s.id, title: s.title, fields: d.fields.filter((f) => f.section_id === s.id) })),
    text: Object.fromEntries(d.submissions.map((s) => [s.field_id, s.value_text])),
    files: d.files,
  };
}

function FieldReview({ field, sub, files, onDone }: { field: Detail["fields"][number]; sub: Detail["submissions"][number] | undefined; files: Detail["files"]; onDone: () => Promise<unknown> }) {
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = answerLabel(sub?.status);

  const decide = async (decision: "approve" | "adjust") => {
    setBusy(true);
    setError("");
    try {
      await reviewField({ data: { fieldId: field.id, decision, note } });
      setAsking(false);
      setNote("");
      await onDone();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const open = async (path: string) => {
    try {
      window.open(await signedUrl(path), "_blank", "noopener");
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <div className="border-t border-border py-3">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{field.label}</p><Badge s={status} /></div>
      {sub?.value_text && <p className="mt-1 whitespace-pre-wrap text-sm">{sub.value_text}</p>}
      {isFileField(field.field_type) && files.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {files.map((x) => (
            <li key={x.id}>
              <button className="underline-offset-2 hover:underline" onClick={() => open(x.storage_path)}>📎 {x.file_name}</button> · {fmtMb(x.size_bytes)} · {x.image_status === "done" ? "WebP pronto" : x.image_status === "pending" || x.image_status === "processing" ? "WebP a preparar" : "só original"}
            </li>
          ))}
        </ul>
      )}
      {sub?.rejection_note && status === "ajuste" && <p className="mt-1 text-xs text-destructive">Nota: {sub.rejection_note}</p>}
      {status === "enviado" && !asking && (
        <div className="mt-2 flex gap-2">
          <Btn className="px-3 py-1" disabled={busy} onClick={() => decide("approve")}>Aprovar</Btn>
          <Btn variant="outline" className="px-3 py-1" disabled={busy} onClick={() => setAsking(true)}>Pedir ajuste</Btn>
        </div>
      )}
      {asking && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} placeholder="O que falta?" value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
          <Btn disabled={!note.trim() || busy} onClick={() => decide("adjust")}>Enviar</Btn>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
