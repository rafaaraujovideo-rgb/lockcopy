import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getSupabase } from "@/lib/supabase-browser";
import { getRequestDetail, reviewField, sendReminder, setRequestLink } from "@/lib/api.functions";
import { answerLabel, eventText, fmtDate, fmtMb, friendlyError, isFileField, requestLinkState } from "@/lib/lockcopy";
import { framerJson, webflowCsv, zipEntries, zipTextEntries, type ExportInput } from "@/lib/exports";
import { workspaceKey } from "@/lib/workspace";
import { nextReminderDate } from "@/lib/reminders";
import { Badge, Btn, Card, download, inputClass } from "@/components/ui-bits";
import { Bell, Check, Send, User } from "lucide-react";

export const Route = createFileRoute("/app/requests/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Review request — Lockcopy" },
      { name: "description", content: "Review, approve and export the content sent by the client." },
      { property: "og:title", content: "Review request — Lockcopy" },
      { property: "og:description", content: "Review, approve and export the client's content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestPage,
});

type Detail = Awaited<ReturnType<typeof getRequestDetail>>;

const BUCKET = "client-uploads";

// Authenticated download: storage rules check membership on every request,
// so no shareable link exists that outlives a member's removal.
async function downloadFile(path: string): Promise<Blob> {
  const { data, error } = await getSupabase().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "File unavailable.");
  return data;
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

  if (q.isLoading) return <div className="space-y-3"><div className="h-8 w-56 animate-pulse rounded-md bg-muted" />{[0,1].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-muted/60" />)}</div>;
  if (q.error || !d || !exp) return <Card><p className="text-sm text-destructive">{q.error ? friendlyError(q.error) : "Request not found."}</p><Link to="/app" className="mt-2 inline-block text-sm text-muted-foreground hover:underline">← Requests</Link></Card>;

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
      if (ok) { setMsg(ok); toast.success(ok); }
      await refresh();
    } catch (e) {
      setMsg(friendlyError(e)); toast.error(friendlyError(e));
    } finally {
      setBusy("");
    }
  };

  const zip = () =>
    run("zip", async () => {
      const entries = zipEntries(exp);
      const texts = zipTextEntries(exp);
      if (!entries.length && !texts.length) throw new Error("There is no content in this request yet.");
      const { zipSync, strToU8 } = await import("fflate");
      const files: Record<string, Uint8Array> = {};
      for (const t of texts) files[t.zipPath] = strToU8(t.content);
      for (const e of entries) {
        const blob = await downloadFile(e.storagePath).catch(() => {
          throw new Error(`Could not download ${e.zipPath}.`);
        });
        files[e.zipPath] = new Uint8Array(await blob.arrayBuffer());
      }
      const blob = new Blob([zipSync(files, { level: 0 }) as Uint8Array<ArrayBuffer>], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${r.client_name}-content.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <Link to="/app" className="text-sm text-muted-foreground hover:underline">← Requests</Link>
          <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.03em]">{r.client_name}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{r.title} · {done}/{total} fields · due {fmtDate(r.due_date)}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} /></div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{total ? Math.round((done / total) * 100) : 0}% done</span>
          </div>
        </div>
        {d.sections.map((s) => (
          <Card key={s.id}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              {(() => {
                const pending = d.fields.filter((f) => f.section_id === s.id && subs.get(f.id)?.status === "submitted");
                return pending.length > 0 ? (
                  <Btn variant="outline" className="px-3 py-1 text-xs" disabled={!!busy} onClick={() => run(`all-${s.id}`, async () => { for (const f of pending) await reviewField({ data: { fieldId: f.id, decision: "approve", note: "" } }); }, `${pending.length} fields approved.`)}>
                    {busy === `all-${s.id}` ? "Approving…" : `Approve all (${pending.length})`}
                  </Btn>
                ) : null;
              })()}
            </div>
            {d.fields.filter((f) => f.section_id === s.id).map((f) => (
              <FieldReview key={f.id} field={f} sub={subs.get(f.id)} files={d.files.filter((x) => x.field_id === f.id)} onDone={refresh} />
            ))}
          </Card>
        ))}
      </div>

      <aside className="space-y-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between"><p className="text-sm font-medium">Client link</p><Badge s={ls} /></div>
          <p className="break-all rounded bg-muted p-2 text-xs">{link}</p>
          <p className="text-xs text-muted-foreground">Expires on {fmtDate(r.expires_at)}</p>
          {ls === "active" && done < total && (() => {
            const next = nextReminderDate(r, new Date().toISOString().slice(0, 10));
            return <p className="text-xs text-muted-foreground">{next ? <>Next automatic reminder: <span className="font-mono text-foreground">{fmtDate(next)}</span></> : r.due_date ? "No automatic reminders left." : "Set a deadline to turn on automatic reminders."}</p>;
          })()}
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1" disabled={ls !== "active"} onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? "Copied" : "Copy"}</Btn>
            <a href={`/c/${r.token}`} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center rounded-md border border-border bg-card text-sm shadow-card hover:bg-muted">Open</a>
          </div>
          {ls === "active" ? (
            <>
              <Btn variant="outline" className="w-full" disabled={!!busy} onClick={() => run("rem", () => sendReminder({ data: { requestId: r.id } }), "Reminder queued for sending.")}>Send reminder</Btn>
              <Btn variant="ghost" className="w-full text-destructive" disabled={!!busy} onClick={() => run("link", () => setRequestLink({ data: { requestId: r.id, revoke: true } }), "Link switched off.")}>Switch off link</Btn>
            </>
          ) : (
            <Btn variant="outline" className="w-full" disabled={!!busy} onClick={() => run("link", () => setRequestLink({ data: { requestId: r.id, revoke: false } }), "Link reactivated.")}>Reactivate link</Btn>
          )}
          {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        </Card>
        <Card className="space-y-2">
          <p className="text-sm font-medium">Export</p>
          <Btn variant="outline" className="w-full" disabled={!!busy} onClick={zip}>{busy === "zip" ? "Preparing ZIP…" : "ZIP per page"}</Btn>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client_name}-webflow.csv`, webflowCsv(exp), "text/csv")}>CSV for Webflow</Btn>
          <Btn variant="outline" className="w-full" onClick={() => download(`${r.client_name}-framer.json`, framerJson(exp), "application/json")}>JSON for Framer</Btn>
          <p className="text-xs text-muted-foreground">Ready to import into Webflow CMS or Framer, organized by page.</p>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-medium">History</p>
          <ol className="space-y-2 text-xs">
            {d.events.slice(0, 50).map((e, i, arr) => {
              const Icon = e.actor === "client" ? Send : e.actor === "agency" ? (/approv/i.test(e.kind) ? Check : User) : Bell;
              return (
                <li key={e.id} className="relative flex gap-2.5 pb-1">
                  {i < arr.length - 1 && <span aria-hidden className="absolute left-[9px] top-5 h-[calc(100%-0.25rem)] w-px bg-border" />}
                  <span className={`relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-border ${e.actor === "client" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground"}`}><Icon className="h-2.5 w-2.5" /></span>
                  <span className="min-w-0">
                    <span className="font-medium">{e.actor === "client" ? "Client" : e.actor === "agency" ? "Agency" : "System"}</span> — {eventText(e.kind, e.detail)}
                    <span className="block font-mono text-[10.5px] text-muted-foreground">{new Date(e.created_at).toLocaleString("en-GB")}</span>
                  </span>
                </li>
              );
            })}
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

  const [copied, setCopied] = useState(false);
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
      const win = window.open("", "_blank");
      const url = URL.createObjectURL(await downloadFile(path));
      if (win) win.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <div className="border-t border-border py-3">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{field.label}</p><span className="flex items-center gap-2">{sub?.value_text && <button type="button" onClick={() => { void navigator.clipboard.writeText(sub.value_text ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted">{copied ? "Copied" : "Copy"}</button>}<span key={status} className="inline-flex animate-in fade-in zoom-in-95 duration-300">{status === "approved" && <Check aria-hidden className="mr-1 h-3.5 w-3.5 self-center text-accent-foreground animate-in zoom-in-50 duration-500" />}<Badge s={status} /></span></span></div>
      {sub?.value_text && <p className="mt-1 whitespace-pre-wrap text-sm">{sub.value_text}</p>}
      {isFileField(field.field_type) && files.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {files.map((x) => (
            <li key={x.id}>
              <button className="underline-offset-2 hover:underline" onClick={() => open(x.storage_path)}>{x.file_name}</button> · {fmtMb(x.size_bytes)} · {x.image_status === "done" ? "WebP ready" : x.image_status === "pending" || x.image_status === "processing" ? "WebP processing" : "original only"}
            </li>
          ))}
        </ul>
      )}
      {(sub as { client_note?: string | null } | undefined)?.client_note && <p className="mt-2 rounded-md border border-border bg-muted/60 p-2 text-xs"><span className="font-medium">Client asks:</span> {(sub as { client_note?: string | null }).client_note}</p>}
      {sub?.rejection_note && status === "adjust" && <p className="mt-1 text-xs text-destructive">Note: {sub.rejection_note}</p>}
      {status === "sent" && !asking && (
        <div className="mt-2 flex gap-2">
          <Btn className="px-3 py-1" disabled={busy} onClick={() => decide("approve")}>Approve</Btn>
          <Btn variant="outline" className="px-3 py-1" disabled={busy} onClick={() => setAsking(true)}>Request change</Btn>
        </div>
      )}
      {asking && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} placeholder="What is missing?" value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
          <Btn disabled={!note.trim() || busy} onClick={() => decide("adjust")}>Send</Btn>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
