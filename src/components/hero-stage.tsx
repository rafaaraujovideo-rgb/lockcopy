import { useEffect, useState } from "react";
import { Check, Copy, Lock, Upload } from "lucide-react";
import { Badge, inputClass } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

/** Mirrors the real portal (/c/$token) and review page (/app/requests/$id) with one shared state. */
type St = "empty" | "sent" | "approved" | "adjust";
type F = { id: string; page: number; label: string; kind: "text" | "file"; value: string; limit?: number };
const PAGES = ["Home", "About", "Contact"];
const START: F[] = [
  { id: "h", page: 0, label: "Hero headline", kind: "text", value: "", limit: 90 },
  { id: "c", page: 0, label: "Cover photo", kind: "file", value: "" },
  { id: "s", page: 1, label: "Your story", kind: "text", value: "Three generations of bakers on Elm Street.", limit: 1200 },
  { id: "t", page: 1, label: "Team photos", kind: "file", value: "team-1.jpg, team-2.jpg · 2.4 MB → 412 KB WebP" },
  { id: "o", page: 2, label: "Opening hours", kind: "text", value: "Mon–Sat · 7:00–19:00", limit: 120 },
];
const LINK = "lockcopy.com/c/8f3a2c1e-4d7b-4a6f-b05e-92c1e7d4b71d";

export function HeroStage() {
  const [v, setV] = useState<"client" | "studio">("client");
  const [fields, setFields] = useState(START);
  const [st, setSt] = useState<Record<string, St>>({ h: "empty", c: "empty", s: "sent", t: "sent", o: "approved" });
  const set = (id: string, value: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field || st[id] === "approved") return;
    const bounded = field.limit ? value.slice(0, field.limit) : value;
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, value: bounded } : f)));
    setSt((s) => ({ ...s, [id]: bounded ? "sent" : "empty" }));
  };
  const review = (id: string, s: St) => setSt((x) => ({ ...x, [id]: s }));
  return (
    <div>
      <div className="relative mx-auto mb-5 grid w-fit grid-cols-2 rounded-md border border-border bg-muted p-1 text-xs">
        <span aria-hidden className="pill absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded bg-card shadow-card" style={{ transform: v === "studio" ? "translateX(100%)" : "none" }} />
        {(["client", "studio"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setV(k)} className={"relative rounded px-3.5 py-1.5 font-medium transition-colors duration-300 " + (v === k ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>{k === "client" ? "1 · Your client fills it in" : "2 · Your studio approves"}</button>
        ))}
      </div>
      <div className="relative mx-auto max-w-3xl">
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[1.25rem] bg-seal/10 blur-2xl" />
        <div className="overflow-hidden rounded-xl border border-border bg-card text-left shadow-window specular">
          <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
            <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-border" />)}</div>
            <div className="mx-auto flex min-w-0 items-center gap-1.5 truncate rounded-md bg-muted px-3 py-1 font-mono text-[10px] text-muted-foreground"><Lock className="h-2.5 w-2.5 shrink-0" />{v === "client" ? LINK : "lockcopy.com/app/requests/5c1d8e3b-a274-4f09-9b6e-e8f2a0c47d15"}</div>
            <span className="w-10" />
          </div>
          <div key={v} className="animate-lc-in">
            {v === "client" ? <Client fields={fields} st={st} set={set} onSend={() => setV("studio")} /> : <Studio fields={fields} st={st} review={review} />}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">Try it: type an answer, add a photo, then approve it as the studio.</p>
    </div>
  );
}

const done = (s: St | undefined) => s === "sent" || s === "approved";

function Client({ fields, st, set, onSend }: { fields: F[]; st: Record<string, St>; set: (id: string, v: string) => void; onSend: () => void }) {
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => {
      set(busy, "storefront.jpg · 3.1 MB → 486 KB WebP");
      setBusy(null);
    }, 650);
    return () => window.clearTimeout(timer);
    // A sample conversion is local to this view and is cancelled on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);
  const pct = Math.round((fields.filter((f) => done(st[f.id])).length / fields.length) * 100);
  return (
    <div>
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Norte Studio · for Bloom Bakery · due Dec 4</p>
        <div className="mt-1 flex items-center gap-3">
          <p className="font-display text-base font-semibold">New website content</p>
          <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs">{pct}%</span>
        </div>
      </div>
      <div className="space-y-4 px-4 py-4">
        <nav aria-label="Pages" className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {PAGES.map((p, i) => {
            const fs = fields.filter((f) => f.page === i);
            const d = fs.filter((f) => done(st[f.id])).length;
            return (
              <button key={p} type="button" onClick={() => setTab(i)} className={"-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm " + (i === tab ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {d === fs.length && <Check className="h-3.5 w-3.5 text-seal" />}{p}<span className="font-mono text-[10px] text-muted-foreground">{d}/{fs.length}</span>
              </button>
            );
          })}
        </nav>
        {fields.filter((f) => f.page === tab).map((f) => {
          const locked = st[f.id] === "approved";
          return (
            <div key={f.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2"><label htmlFor={`demo-${f.id}`} className="text-sm font-medium">{f.label}</label>{locked ? <span className="inline-flex items-center gap-1 text-[11px] text-seal"><Lock className="h-3 w-3" />Approved — locked</span> : st[f.id] === "sent" && <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-seal"><span key={f.value} aria-hidden className="demo-save-dot h-1.5 w-1.5 rounded-full bg-seal" />saved</span>}</div>
              {f.kind === "text" ? (
                <div>
                  <input id={`demo-${f.id}`} className={inputClass} disabled={locked} maxLength={f.limit} value={f.value} placeholder="Type here. It saves automatically." onChange={(e) => set(f.id, e.target.value)} />
                  {f.limit && <div className={"mt-2 flex items-center gap-3 transition-colors duration-200 " + (f.value.length === f.limit ? "text-destructive" : f.value.length >= f.limit * 0.9 ? "text-warn-foreground" : "text-seal")}>
                    <div aria-hidden className="h-0.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="demo-limit-bar h-full rounded-full bg-current" style={{ width: `${f.value.length / f.limit * 100}%` }} /></div>
                    <span className="flex w-32 shrink-0 justify-end gap-1 font-mono text-[10px] tabular-nums"><span key={f.value.length} className="demo-count inline-block">{f.value.length}</span>/{f.limit}{f.value.length === f.limit && <Lock aria-label="Character limit reached" className="h-3 w-3" />}</span>
                  </div>}
                </div>
              ) : f.value ? (
                <div role="status" className="demo-photo-ready flex min-h-16 items-center gap-2 rounded-md border border-seal/30 bg-accent/40 px-3 py-2 text-xs"><Check aria-hidden className="h-4 w-4 shrink-0 text-seal" /><div className="min-w-0"><p className="break-words">{f.value}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">Sample photo</p></div></div>
              ) : (
                <Button id={`demo-${f.id}`} type="button" variant="outline" disabled={busy !== null} onClick={() => setBusy(f.id)} className="relative h-16 w-full overflow-hidden whitespace-normal border-dashed bg-card px-3 text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:border-primary disabled:opacity-100">{busy === f.id ? <><span role="status" className="text-foreground">Converting sample to WebP…</span><span aria-hidden className="demo-conversion-bar absolute bottom-0 left-0 h-0.5 bg-seal" /></> : <><Upload aria-hidden />Click to upload a sample photo</>}</Button>
              )}
            </div>
          );
        })}
        <div className="flex justify-between gap-3 pt-1">
          <button type="button" aria-label={tab > 0 ? `Previous page: ${PAGES[tab - 1] ?? ""}` : "Previous page"} disabled={tab === 0} onClick={() => setTab(tab - 1)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs shadow-card disabled:opacity-40">← Previous</button>
          {tab < PAGES.length - 1
            ? <button type="button" aria-label={`Next page: ${PAGES[tab + 1] ?? ""}`} onClick={() => setTab(tab + 1)} className="press rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-btn">Next page →</button>
            : <button type="button" onClick={onSend} className="press rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-btn">See it as the studio →</button>}
        </div>
      </div>
    </div>
  );
}

function Studio({ fields, st, review }: { fields: F[]; st: Record<string, St>; review: (id: string, s: St) => void }) {
  const [copied, setCopied] = useState(false);
  const n = fields.filter((f) => done(st[f.id])).length;
  const approved = fields.filter((f) => st[f.id] === "approved").length;
  return (
    <div className="grid gap-4 p-4 md:grid-cols-[1fr_200px]">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">← Requests</p>
          <p className="font-display text-xl font-semibold tracking-[-0.03em]">Bloom Bakery</p>
          <p className="font-mono text-[11px] text-muted-foreground">New website content · {n}/{fields.length} fields · {approved} approved</p>
        </div>
        {PAGES.map((p, i) => (
          <div key={p} className="rounded-lg border border-border p-3">
            <p className="mb-1 font-display text-sm font-semibold">{p}</p>
            {fields.filter((f) => f.page === i).map((f) => {
              const s = st[f.id] ?? "empty";
              return (
                <div key={f.id} data-approved={s === "approved"} className="demo-review-row flex min-h-16 flex-wrap items-center gap-2 border-t border-border py-2 first:border-t-0">
                  <div className="min-w-0 flex-1"><p className="text-[11px] text-muted-foreground">{f.label}</p><p className="truncate text-sm">{f.value || <span className="text-muted-foreground">Not sent yet</span>}</p></div>
                  {s === "sent" ? (
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => review(f.id, "adjust")} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted">Request change</button>
                      <Button type="button" size="sm" onClick={() => review(f.id, "approved")} className="press h-7 px-2 text-[11px] shadow-btn"><Check aria-hidden className="h-3 w-3" />Approve</Button>
                    </div>
                  ) : s === "approved" ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => review(f.id, "sent")} aria-label={`Unlock ${f.label}`} title="Unlock" className="demo-lock-stamp h-7 px-1"><Badge s="approved" /></Button>
                  ) : <Badge s={s} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <aside className="space-y-3">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between"><p className="text-xs font-medium">Client link</p><Badge s="active" /></div>
          <p className="break-all rounded bg-muted p-2 font-mono text-[10px]">{LINK}</p>
          <button type="button" onClick={() => setCopied(true)} className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card py-1.5 text-xs shadow-card hover:bg-muted">{copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}</button>
        </div>
        <div className="space-y-1.5 rounded-lg border border-border p-3">
          <p className="text-xs font-medium">Export</p>
          {["Webflow CMS (API)", "ZIP (WebP)", "Webflow CSV", "Framer JSON"].map((x) => <p key={x} className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">{x}</p>)}
        </div>
      </aside>
    </div>
  );
}
