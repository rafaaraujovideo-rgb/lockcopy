import { useEffect, useState } from "react";
import { Check, Copy, Link2, Lock, Upload, FileText, Image as ImageIcon, Download, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { t: "Send the link", d: "Pick a template and share a private link." },
  { t: "Client fills it in", d: "No account. Texts and files, page by page." },
  { t: "Review and approve", d: "Approve field by field. Approved stays locked." },
  { t: "Export", d: "CSV for Webflow, JSON for Framer or ZIP." },
];

type St = "enviado" | "aprovado" | "ajuste";
const FIELDS = [
  { id: "hero", page: "Home", label: "Main headline", value: "A family dental clinic in the city centre since 1998." },
  { id: "capa", page: "Home", label: "Cover photo", value: "facade.jpg · 2.1 MB" },
  { id: "historia", page: "About", label: "Your story", value: "Founded by Dr. Sousa, the clinic…" },
  { id: "logo", page: "Contact", label: "Logo", value: "logo-sousa.svg · 48 KB" },
];
const HERO_TEXT = FIELDS[0]!.value;

export function LandingDemo() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [copied, setCopied] = useState(false);
  const [typed, setTyped] = useState(0);
  const [up, setUp] = useState(0);
  const [st, setSt] = useState<Record<string, St>>({ hero: "enviado", capa: "enviado", historia: "enviado", logo: "enviado" });
  const [fmt, setFmt] = useState<"webflow" | "framer" | "zip">("webflow");

  // auto-advance until the visitor interacts
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % 4), 6500);
    return () => clearTimeout(id);
  }, [step, auto]);

  // client typing + upload simulation
  useEffect(() => {
    if (step !== 1) return;
    setTyped(0); setUp(0);
    const a = setInterval(() => setTyped((n) => Math.min(n + 1, HERO_TEXT.length)), 35);
    const b = setInterval(() => setUp((n) => Math.min(n + 4, 100)), 60);
    return () => { clearInterval(a); clearInterval(b); };
  }, [step]);

  const go = (i: number) => { setAuto(false); setStep(i); };
  const approved = Object.values(st).filter((v) => v === "aprovado").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <ol className="flex gap-2 overflow-x-auto lg:flex-col">
        {STEPS.map((s, i) => (
          <li key={s.t} className="min-w-[200px] lg:min-w-0">
            <button
              onClick={() => go(i)}
              className={cn(
                "relative w-full overflow-hidden rounded-lg border p-4 text-left transition-all",
                step === i ? "border-primary/20 bg-card shadow-card" : "border-transparent hover:bg-card/60",
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-semibold", step === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                <span className="font-semibold">{s.t}</span>
              </div>
              <p className="mt-1.5 pl-9 text-sm text-muted-foreground">{s.d}</p>
              {step === i && auto && <span key={step} className="absolute bottom-0 left-0 h-0.5 bg-seal" style={{ animation: "lc-bar 6.5s linear forwards" }} />}
            </button>
          </li>
        ))}
      </ol>

      <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-border bg-card shadow-float">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" /><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
          <span className="ml-3 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
            {step === 1 ? "lockcopy.app/c/x7k2q9" : "lockcopy.app/app/pedidos/sousa-clinic"}
          </span>
        </div>

        <div key={step} className="animate-lc-in p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New request</p>
                <h4 className="mt-1 text-xl font-bold">Sousa Clinic · Business website</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Business site", "Landing page", "E-commerce"].map((m, i) => (
                  <div key={m} className={cn("rounded-lg border p-4 text-sm", i === 0 ? "border-primary bg-primary/5" : "border-border")}>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="mt-2 font-medium">{m}</p>
                    <p className="text-xs text-muted-foreground">{[7, 4, 9][i]} fields</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2 pl-4">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">https://lockcopy.app/c/x7k2q9</span>
                <button
                  onClick={() => { setCopied(true); setAuto(false); setTimeout(() => { setCopied(false); setStep(1); }, 900); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                >
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy link</>}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Try it: click “Copy link” to see what the client receives.</p>
            </div>
          )}

          {step === 1 && (
            <div className="mx-auto max-w-md space-y-5">
              <div>
                <p className="text-xs text-muted-foreground">Request from Norte Studio</p>
                <h4 className="text-xl font-bold">Content for the new site</h4>
                <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-seal transition-all" style={{ width: `${20 + up * 0.4}%` }} /></div>
              </div>
              <label className="block">
                <span className="text-sm font-medium">Main headline</span>
                <div className="mt-1.5 rounded-lg border border-ring/40 bg-card px-3 py-2.5 text-sm ring-2 ring-ring/15">
                  {HERO_TEXT.slice(0, typed)}<span className="animate-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-foreground" />
                </div>
              </label>
              <div>
                <span className="text-sm font-medium">Cover photo</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs"><span>facade.jpg</span><span className="text-muted-foreground">{up < 100 ? `${up}%` : "Uploaded ✓"}</span></div>
                    <div className="mt-1.5 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${up}%` }} /></div>
                  </div>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Saved automatically</span>
                <button onClick={() => go(2)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"><Send className="h-3.5 w-3.5" /> Send to agency</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold">Review content</h4>
                <span className="text-sm text-muted-foreground">{approved} of {FIELDS.length} approved</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-seal transition-all duration-500" style={{ width: `${(approved / FIELDS.length) * 100}%` }} /></div>
              <div className="divide-y divide-border rounded-lg border border-border">
                {FIELDS.map((f) => {
                  const s = st[f.id];
                  return (
                    <div key={f.id} className={cn("flex flex-wrap items-center gap-3 p-3.5 transition-colors", s === "aprovado" && "bg-accent/40")}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{f.page} · {f.label}</p>
                        <p className="truncate text-sm">{f.value}</p>
                      </div>
                      {s === "aprovado" ? (
                        <button onClick={() => { setAuto(false); setSt({ ...st, [f.id]: "enviado" }); }} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"><Lock className="h-3 w-3" /> Locked</button>
                      ) : s === "ajuste" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive"><MessageSquare className="h-3 w-3" /> Change requested</span>
                      ) : (
                        <div className="flex gap-1.5">
                          <button onClick={() => { setAuto(false); setSt({ ...st, [f.id]: "ajuste" }); }} className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted">Request change</button>
                          <button onClick={() => { setAuto(false); setSt({ ...st, [f.id]: "aprovado" }); }} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">Approve</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Try it: approve fields and watch them lock.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-xl font-bold">Export to the site</h4>
                <div className="inline-flex rounded-lg bg-muted p-1 text-xs">
                  {(["webflow", "framer", "zip"] as const).map((k) => (
                    <button key={k} onClick={() => { setAuto(false); setFmt(k); }} className={cn("rounded-md px-3 py-1.5 font-medium", fmt === k ? "bg-card shadow-sm" : "text-muted-foreground")}>
                      {k === "webflow" ? "Webflow CSV" : k === "framer" ? "Framer JSON" : "ZIP"}
                    </button>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-primary p-4 font-mono text-xs leading-relaxed text-primary-foreground/90">
{fmt === "webflow" && `page,field,value
home,main-headline,"A family dental clinic in the city centre since 1998."
home,cover-photo,assets/home/facade.webp
about,story,"Founded by Dr. Sousa, the clinic…"
contact,logo,assets/contact/logo-sousa.svg`}
{fmt === "framer" && `{
  "home": {
    "mainHeadline": "A family dental clinic in the city centre since 1998.",
    "coverPhoto": "assets/home/facade.webp"
  },
  "about": { "story": "Founded by Dr. Sousa, the clinic…" }
}`}
{fmt === "zip" && `sousa-clinic.zip
├── home/
│   ├── texts.md
│   └── facade.webp
├── about/
│   └── texts.md
└── contact/
    └── logo-sousa.svg`}
              </pre>
              <button className="inline-flex items-center gap-2 rounded-lg bg-seal px-4 py-2 text-sm font-medium text-primary-foreground"><Download className="h-4 w-4" /> Download</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
