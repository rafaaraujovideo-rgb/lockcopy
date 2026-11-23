import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { Badge, inputClass } from "@/components/ui-bits";

/** Mirrors the real portal (/c/$token) and review page (/app/requests/$id) with one shared state. */
type St = "empty" | "sent" | "approved" | "adjust";
type F = { id: string; page: number; label: string; kind: "text" | "file"; value: string };
const PAGES = ["Home", "About", "Contact"];
const START: F[] = [
  { id: "h", page: 0, label: "Hero headline", kind: "text", value: "" },
  { id: "c", page: 0, label: "Cover photo", kind: "file", value: "" },
  { id: "s", page: 1, label: "Your story", kind: "text", value: "Three generations of bakers on Elm Street." },
  { id: "t", page: 1, label: "Team photos", kind: "file", value: "team-1.jpg, team-2.jpg · 2.4 MB → 412 KB WebP" },
  { id: "o", page: 2, label: "Opening hours", kind: "text", value: "Mon–Sat · 7:00–19:00" },
];
const LINK = "lockcopy.com/c/8f3a2c1e-4d7b-4a6f-b05e-92c1e7d4b71d";

export function HeroStage() {
  const [v, setV] = useState<"client" | "studio">("client");
  const [fields, setFields] = useState(START);
  const [st, setSt] = useState<Record<string, St>>({ h: "empty", c: "empty", s: "sent", t: "sent", o: "approved" });
  const set = (id: string, value: string) => {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, value } : f)));
    setSt((s) => ({ ...s, [id]: value ? "sent" : "empty" }));
  };
  const review = (id: string, s: St) => setSt((x) => ({ ...x, [id]: s }));
  return (
    <div>
      <div className="mx-auto mb-5 flex w-fit rounded-md border border-border bg-muted p-1 text-xs">
        {(["client", "studio"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setV(k)} className={"rounded px-3.5 py-1.5 font-medium transition-all duration-300 " + (v === k ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>{k === "client" ? "1 · Your client fills it in" : "2 · Your studio approves"}</button>
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
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{f.label}</span>{locked ? <span className="inline-flex items-center gap-1 text-[11px] text-seal"><Lock className="h-3 w-3" />Approved — locked</span> : st[f.id] === "sent" && <span className="font-mono text-[10px] text-seal">● saved</span>}</div>
              {f.kind === "text" ? (
                <input className={inputClass} disabled={locked} value={f.value} placeholder="Type here. It saves automatically." onChange={(e) => set(f.id, e.target.value)} />
              ) : f.value ? (
                <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs">{f.value}</p>
              ) : (
                <button type="button" onClick={() => set(f.id, "storefront.jpg · 3.1 MB → 486 KB WebP")} className="w-full rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground hover:border-primary hover:text-foreground">Click to upload a sample photo</button>
              )}
            </div>
          );
        })}
        <div className="flex justify-between gap-3 pt-1">
          <button type="button" disabled={tab === 0} onClick={() => setTab(tab - 1)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs shadow-card disabled:opacity-40">← Previous</button>
          {tab < PAGES.length - 1
            ? <button type="button" onClick={() => setTab(tab + 1)} className="press rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-btn">Next page →</button>
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
                <div key={f.id} className="flex flex-wrap items-center gap-2 border-t border-border py-2 first:border-t-0">
                  <div className="min-w-0 flex-1"><p className="text-[11px] text-muted-foreground">{f.label}</p><p className="truncate text-sm">{f.value || <span className="text-muted-foreground">Not sent yet</span>}</p></div>
                  {s === "sent" ? (
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => review(f.id, "adjust")} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted">Request change</button>
                      <button type="button" onClick={() => review(f.id, "approved")} className="press rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground shadow-btn">Approve</button>
                    </div>
                  ) : s === "approved" ? (
                    <button type="button" onClick={() => review(f.id, "sent")} title="Unlock" className="animate-lc-in"><Badge s="approved" /></button>
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
          {["ZIP (WebP)", "Webflow CSV", "Framer JSON"].map((x) => <p key={x} className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground">{x}</p>)}
        </div>
      </aside>
    </div>
  );
}
