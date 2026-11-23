import { useState } from "react";
import { Download, Mail, Paperclip, Check, AlertTriangle } from "lucide-react";
import { framerJson, webflowCsv, type ExportInput } from "@/lib/exports";

/** Before/after: the email chase vs. one structured request. */
export function BeforeAfter() {
  const mess = [
    { from: "Client", s: "Re: Re: Fwd: texts for site", n: "home_FINAL_v3 (2).docx", w: true },
    { from: "Client", s: "photos!!", n: "IMG_4471.HEIC · 14 MB", w: true },
    { from: "You", s: "Still missing the About page", n: "", w: false },
    { from: "Client", s: "sorry, here's the logo", n: "logo.jpg · 64 px wide", w: true },
  ];
  const done: Array<[string, string]> = [
    ["Home · Main headline", "Approved"],
    ["Home · Cover photo", "Approved · WebP"],
    ["About · Your story", "Approved"],
    ["Contact · Logo", "Change requested"],
  ];
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2" style={{ gap: 1 }}>
      <div className="bg-card p-6">
        <p className="eyebrow">Without Lockcopy</p>
        <p className="mt-2 text-sm text-muted-foreground">Content arrives in pieces, across threads, in the wrong formats.</p>
        <ul className="mt-5 space-y-2">
          {mess.map((m, i) => (
            <li key={i} className="flex items-start gap-3 rounded-md border border-border bg-background p-3 text-xs">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.from} · <span className="font-normal text-muted-foreground">{m.s}</span></p>
                {m.n && <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted-foreground"><Paperclip className="h-3 w-3" />{m.n}</p>}
              </div>
              {m.w && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn-foreground" />}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-card p-6">
        <p className="eyebrow">With Lockcopy</p>
        <p className="mt-2 text-sm text-muted-foreground">One link, one checklist per page, every field reviewed.</p>
        <div className="mt-5 rounded-md border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
            <span className="font-medium">Sousa Clinic · Business site</span><span className="font-mono text-muted-foreground">3/4</span>
          </div>
          <ul className="divide-y divide-border">
            {done.map(([f, s]) => (
              <li key={f} className="flex items-center justify-between px-3 py-2.5 text-xs">
                <span>{f}</span>
                <span className={"rounded-md px-2 py-0.5 font-medium " + (s.startsWith("Change") ? "bg-warn text-warn-foreground" : "bg-accent text-accent-foreground")}>
                  {s.startsWith("Change") ? "↺ " : "✓ "}{s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const SAMPLE: ExportInput = {
  title: "Business site",
  client: "Sousa Dental Clinic",
  sections: [
    { id: "home", title: "Home", fields: [{ id: "hero", label: "Main headline", field_type: "short_text" }, { id: "cover", label: "Cover photo", field_type: "image" }] },
    { id: "about", title: "About", fields: [{ id: "story", label: "Your story", field_type: "long_text" }] },
    { id: "contact", title: "Contact", fields: [{ id: "phone", label: "Phone", field_type: "short_text" }, { id: "logo", label: "Logo", field_type: "image" }] },
  ],
  text: {
    hero: "A family dental clinic in the city centre since 1998.",
    story: "Founded by Dr. Ana Sousa, the clinic has cared for three generations of families with calm, honest dentistry.",
    phone: "+351 210 000 000",
  },
  files: [
    { field_id: "cover", file_name: "facade.webp", storage_path: "", webp_storage_path: null },
    { field_id: "logo", file_name: "logo-sousa.webp", storage_path: "", webp_storage_path: null },
  ],
};

async function sampleImage(label: string, w: number, h: number): Promise<Uint8Array> {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  ctx.fillStyle = css.getPropertyValue("--muted").trim() || "#eee";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = css.getPropertyValue("--foreground").trim() || "#222";
  ctx.font = `600 ${Math.round(h / 10)}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, w / 2, h / 2);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.82));
  return new Uint8Array(await (blob ?? new Blob()).arrayBuffer());
}

/** Lets visitors download a real example export before signing up. */
export function SampleExport() {
  const [busy, setBusy] = useState(false);
  const get = async () => {
    setBusy(true);
    try {
      const { zipSync, strToU8 } = await import("fflate");
      const zip = zipSync({
        "README.txt": strToU8("Lockcopy sample export — Sousa Dental Clinic\n\nwebflow.csv  → import into a Webflow CMS collection\nframer.json  → structured content per page for Framer\nhome/, contact/ → images per page and field, converted to WebP\n"),
        "webflow.csv": strToU8(webflowCsv(SAMPLE)),
        "framer.json": strToU8(framerJson(SAMPLE)),
        "home/cover-photo/webp/facade.webp": await sampleImage("Cover photo", 1600, 900),
        "contact/logo/webp/logo-sousa.webp": await sampleImage("Logo", 600, 600),
      });
      const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url; a.download = "lockcopy-sample-export.zip"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-card md:flex-row md:items-center md:justify-between">
      <div>
        <p className="eyebrow">See the output</p>
        <h3 className="mt-2 text-xl font-bold tracking-tight">Download a real sample export.</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">The exact files your team receives: Webflow CSV, Framer JSON and WebP images sorted by page and field.</p>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">{["webflow.csv", "framer.json", "home/…/facade.webp", "README.txt"].map((x) => <span key={x} className="rounded-md border border-border bg-background px-2 py-1">{x}</span>)}</div>
      </div>
      <button onClick={get} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-btn hover:bg-ink-soft disabled:opacity-60">
        <Download className="h-4 w-4" />{busy ? "Preparing…" : "Download sample ZIP"}
      </button>
    </div>
  );
}

/** Rough estimate from the visitor's own numbers; never a promise. */
export function savingsEstimate(projects: number, hoursPerProject: number, rate: number) {
  const hours = Math.max(0, projects) * Math.max(0, hoursPerProject);
  return { hours, value: Math.round(hours * Math.max(0, rate)) };
}

export function SavingsCalc() {
  const [projects, setProjects] = useState(4);
  const [hrs, setHrs] = useState(3);
  const [rate, setRate] = useState(50);
  const { hours, value } = savingsEstimate(projects, hrs, rate);
  const row = (label: string, v: number, set: (n: number) => void, min: number, max: number, unit: string) => (
    <label className="block">
      <span className="flex justify-between text-sm"><span>{label}</span><span className="font-mono text-muted-foreground">{v}{unit}</span></span>
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" />
    </label>
  );
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-border md:grid-cols-[1.2fr_1fr]" style={{ gap: 1 }}>
      <div className="space-y-5 bg-card p-6">
        {row("New websites per month", projects, setProjects, 1, 20, "")}
        {row("Hours spent chasing content per site", hrs, setHrs, 1, 10, " h")}
        {row("Your hourly rate", rate, setRate, 20, 150, " $")}
      </div>
      <div className="flex flex-col justify-center bg-muted/60 p-6">
        <p className="eyebrow">Your estimate</p>
        <p className="mt-2 font-display text-4xl">{hours} h<span className="text-base text-muted-foreground"> / month</span></p>
        <p className="mt-1 text-sm text-muted-foreground">≈ ${value.toLocaleString("en-US")} of time you spend on follow-ups today.</p>
        <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground"><Check className="mt-0.5 h-3 w-3" />Based only on your numbers. Real savings vary by client.</p>
      </div>
    </div>
  );
}
