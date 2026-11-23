import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { getPortalSupabase } from "@/integrations/supabase/portal-client";
import { portalAttachWebp, portalLoad, portalRegisterFile, portalSave, type PortalField, type PortalSubmission } from "@/lib/api.functions";
import { answerLabel, fmtDate, fmtMb, friendlyError, isFileField, uploadProblem, type SubmissionStatus } from "@/lib/lockcopy";
import { Badge, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/c/$token")({
  head: () => ({
    meta: [
      { title: "Send your website content — Lockcopy" },
      { name: "description", content: "Fill in the texts and upload the files your agency asked for." },
      { property: "og:title", content: "Send your website content" },
      { property: "og:description", content: "Fill in the texts and upload the files your agency asked for." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Portal,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Converte uma imagem para WebP no browser (máx. 2048 px no lado maior). */
async function toWebp(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", 0.82));
  } catch {
    return null;
  }
}

const isDone = (st: string | undefined) => st === "submitted" || st === "approved";

function Unavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 text-center">
      <div><h1 className="font-display text-3xl font-bold">This link is no longer available</h1><p className="mt-2 text-muted-foreground">Ask your agency for a new link.</p></div>
    </div>
  );
}

function Portal() {
  const { token } = Route.useParams();
  const valid = UUID.test(token);
  const [tab, setTab] = useState(0);
  const q = useQuery({
    queryKey: ["portal", token],
    queryFn: () => portalLoad({ data: { token } }),
    enabled: valid,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!valid || q.error) return <Unavailable />;
  if (!q.data) return <p className="p-8 text-center text-sm text-muted-foreground">Opening the request…</p>;

  const p = q.data;
  const subs = new Map((p.submissions ?? []).map((s) => [s.field_id, s]));
  const allFields = p.sections.flatMap((s) => s.fields ?? []);
  const done = allFields.filter((f) => isDone(subs.get(f.id)?.status)).length;
  const cur = Math.min(tab, Math.max(0, p.sections.length - 1));
  const sec = p.sections[cur];
  const pct = allFields.length ? Math.round((done / allFields.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-3">
          <p className="text-xs text-muted-foreground">{p.request.agency_name} · for {p.request.client_name} · due {fmtDate(p.request.due_date)}</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="font-display text-lg font-semibold">{p.request.title}</p>
            <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
            <span className="text-xs">{pct}%</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-5 py-8">
        <p className="text-sm text-muted-foreground">Everything is saved automatically. You can leave and come back later with this same link.</p>
        <nav aria-label="Pages" className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {p.sections.map((s, i) => {
            const fs = s.fields ?? [];
            const d = fs.filter((f) => isDone(subs.get(f.id)?.status)).length;
            const complete = fs.length > 0 && d === fs.length;
            return (
              <button key={s.id} onClick={() => setTab(i)} className={"-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm " + (i === cur ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {complete && <Check className="h-3.5 w-3.5 text-seal" />}{s.title}<span className="font-mono text-[10px] text-muted-foreground">{d}/{fs.length}</span>
              </button>
            );
          })}
        </nav>
        {sec && (
          <Card key={sec.id}>
            <h2 className="font-display text-2xl font-semibold">{sec.title}</h2>
            {sec.description && <p className="text-sm text-muted-foreground">{sec.description}</p>}
            {(sec.fields ?? []).map((f) => <FieldInput key={f.id} token={token} field={f} sub={subs.get(f.id)} />)}
          </Card>
        )}
        <div className="flex justify-between gap-3">
          <button disabled={cur === 0} onClick={() => { setTab(cur - 1); window.scrollTo(0, 0); }} className="rounded-md border border-border bg-card px-4 py-2 text-sm shadow-card disabled:opacity-40">← Previous</button>
          {cur < p.sections.length - 1
            ? <button onClick={() => { setTab(cur + 1); window.scrollTo(0, 0); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-btn">Next page →</button>
            : <span className="self-center text-sm text-muted-foreground">{pct === 100 ? "All done — your agency has been notified." : `${allFields.length - done} item(s) left across all pages.`}</span>}
        </div>
      </main>
    </div>
  );
}

function FieldInput({ token, field, sub }: { token: string; field: PortalField; sub: PortalSubmission | undefined }) {
  const qc = useQueryClient();
  const [text, setText] = useState(sub?.value_text ?? "");
  const [status, setStatus] = useState<SubmissionStatus>((sub?.status as SubmissionStatus) ?? "pending");
  const [saved, setSaved] = useState<"" | "saving…" | "saved" | "error saving">("");
  const [uploads, setUploads] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const lastSaved = useRef(sub?.value_text ?? "");
  const locked = status === "approved";

  useEffect(() => {
    if (sub?.status) setStatus(sub.status as SubmissionStatus);
  }, [sub?.status]);

  useEffect(() => {
    if (text === lastSaved.current || locked) return;
    setSaved("saving…");
    const t = setTimeout(async () => {
      try {
        const r = await portalSave({ data: { token, fieldId: field.id, text } });
        lastSaved.current = text;
        setStatus(r.status as SubmissionStatus);
        setSaved("saved");
      } catch (e) {
        setSaved("error saving");
        setErrors([friendlyError(e)]);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [text, token, field.id, locked]);

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    const errs: string[] = [];
    const ok: File[] = [];
    for (const file of Array.from(list)) {
      const problem = uploadProblem(file, field.allowed_mime);
      if (problem) errs.push(problem);
      else ok.push(file);
    }
    setErrors(errs);
    if (!ok.length) return;
    const supabase = getPortalSupabase();
    const { data: prefix, error: prefixError } = await supabase.rpc("portal_upload_prefix", { _token: token, _field: field.id });
    if (prefixError || !prefix) {
      setErrors((e) => [...e, "This link no longer accepts files."]);
      return;
    }
    for (const file of ok) {
      setUploads((u) => [...u, file.name]);
      try {
        const mime = file.type || "image/heic";
        const safe = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "_").slice(-120);
        const path = `${prefix}${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("client-uploads").upload(path, file, { contentType: mime, upsert: false });
        if (upErr) throw new Error(upErr.message);
        const reg = await portalRegisterFile({ data: { token, fieldId: field.id, path, name: file.name, mime, size: file.size } });
        if (reg.image_status === "pending") {
          const webp = await toWebp(file);
          if (webp) {
            const webpPath = path.replace(/\.[a-z0-9]+$/i, "") + ".webp";
            const { error: wErr } = await supabase.storage.from("client-uploads").upload(webpPath, webp, { contentType: "image/webp", upsert: false });
            if (!wErr) await portalAttachWebp({ data: { token, fileId: reg.file_id, webpPath } }).catch(() => undefined);
          }
        }
        setStatus((s) => (s === "approved" ? s : "submitted"));
      } catch (e) {
        setErrors((x) => [...x, `${file.name}: ${friendlyError(e)}`]);
      } finally {
        setUploads((u) => u.filter((n) => n !== file.name));
      }
    }
    await qc.invalidateQueries({ queryKey: ["portal", token] });
  };

  const files = sub?.files ?? [];
  const accept = (field.allowed_mime ?? []).join(",") || undefined;

  return (
    <div className="border-t border-border py-4 first-of-type:border-0">
      <div className="flex items-center justify-between gap-2">
        <label className="font-medium" htmlFor={field.id}>{field.label}{field.is_required && <span className="text-destructive"> *</span>}</label>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">{saved}<Badge s={answerLabel(status)} /></span>
      </div>
      {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
      {status === "rejected" && sub?.rejection_note && <p className="mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">The agency asks: {sub.rejection_note}</p>}
      {locked && <p className="mt-1 text-xs text-muted-foreground">Approved by the agency — nothing else needed here.</p>}
      {field.field_type === "textarea" && <textarea id={field.id} disabled={locked} rows={4} maxLength={field.char_limit ?? 20000} className={inputClass + " mt-2"} value={text} onChange={(e) => setText(e.target.value)} />}
      {(field.field_type === "text" || field.field_type === "select") && <input id={field.id} disabled={locked} maxLength={field.char_limit ?? 20000} className={inputClass + " mt-2"} value={text} onChange={(e) => setText(e.target.value)} />}
      {isFileField(field.field_type) && (
        <div className="mt-2 space-y-2">
          {!locked && (
            <label className="flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed border-border p-5 text-sm text-muted-foreground hover:border-primary">
              Choose files (several at once)
              <span className="text-xs">JPG, PNG, WebP, HEIC, SVG, GIF, PDF · up to 50 MB</span>
              <input id={field.id} type="file" multiple accept={accept} className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
          {uploads.map((n) => <p key={n} className="text-xs text-muted-foreground">Uploading {n}…</p>)}
          <ul className="space-y-1 text-sm">{files.map((x) => <li key={x.id}>📎 {x.file_name} <span className="text-xs text-muted-foreground">{fmtMb(x.size_bytes)}</span></li>)}</ul>
        </div>
      )}
      {errors.map((e) => <p key={e} className="mt-1 text-xs text-destructive">{e}</p>)}
    </div>
  );
}
