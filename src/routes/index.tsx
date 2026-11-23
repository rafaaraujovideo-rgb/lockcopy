import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type React from "react";
import { PLANS } from "@/lib/store";
import { Lock, Menu, X } from "lucide-react";
import { LandingDemo } from "@/components/landing-demo";
import { BeforeAfter, SampleExport, SavingsCalc, StackBar, HeroPreview, Faq, LockToggle, ExportPeek } from "@/components/landing-sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lockcopy — stop chasing clients for content" },
      { name: "description", content: "Per-page checklists, organized uploads and export to Webflow and Framer. For web freelancers and agencies." },
      { property: "og:title", content: "Lockcopy — stop chasing clients for content" },
      { property: "og:description", content: "Per-page checklists, organized uploads and export to Webflow and Framer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [billing, setBilling] = useState<"month" | "year">("month");
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#" className="flex items-center gap-2 text-lg font-bold tracking-tight"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-btn"><Lock className="h-3.5 w-3.5" /></span>Lockcopy</a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#demo" className="hover:text-foreground">Demo</a>
            <a href="#como" className="hover:text-foreground">Features</a>
            <a href="#precos" className="hover:text-foreground">Pricing</a>
            <Link to="/entrar" search={{ modo: "criar", seguir: "/app" }} className="hover:text-foreground">Create account</Link>
          </nav>
          <div className="hidden items-center gap-2 text-sm md:flex">
            <Link to="/entrar" className="rounded-md px-4 py-2 text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/comecar" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-btn hover:bg-ink-soft">Try for free</Link>
          </div>
          <button aria-label="Menu" onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm" onClick={() => setOpen(false)}>
              <a href="#demo">Demo</a><a href="#como">Features</a><a href="#precos">Pricing</a>
              <Link to="/entrar" search={{ modo: "criar", seguir: "/app" }}>Create account</Link>
              <div className="mt-2 flex gap-2">
                <Link to="/entrar" className="flex-1 rounded-md border border-border py-2 text-center">Sign in</Link>
                <Link to="/comecar" className="flex-1 rounded-md bg-primary py-2 text-center font-medium text-primary-foreground">Try it</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-[1fr_1fr] md:items-center md:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground shadow-card"><span className="h-1.5 w-1.5 rounded-full bg-seal" />Content collection for web studios</span>
            <h1 className="mt-7 font-display text-[2.6rem] leading-[1.02] md:text-[4.2rem]">
              Get the copy.<br />Get the photos.<br /><span className="text-muted-foreground">Skip the email chase.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              Send one link. Your client fills in each page and uploads files — no account. You approve field by field, lock it, and export to Webflow or Framer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/comecar" className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-btn hover:bg-ink-soft">Start 14-day trial</Link>
              <a href="#demo" className="rounded-md border border-border bg-card px-5 py-3 text-sm font-medium shadow-card hover:bg-muted">Try the demo ↓</a>
            </div>
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">Card upfront · $0 for 14 days · cancel anytime</p>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8"><StackBar /></div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow">The problem</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">From scattered emails to one checklist.</h2>
          <div className="mt-10"><BeforeAfter /></div>
        </div>
      </section>

      <section id="demo" className="scroll-mt-20 border-b border-border bg-muted/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow">Live demo</p><h2 className="mt-2 font-display text-3xl md:text-4xl">Click through it yourself.</h2></div>
            <p className="max-w-xs text-sm text-muted-foreground">Four steps, the same screens your client and your team use.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 shadow-float"><LandingDemo /></div>
        </div>
      </section>

      <section id="como" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="eyebrow">What you get</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">Built around the part of the project nobody enjoys.</h2>
          <div className="mt-12 grid overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2" style={{ gap: 1 }}>
            <Feature n="01" t="Per-page templates" d="Business site, landing page, e-commerce and rebrand — each page lists exactly what you need.">
              <div className="space-y-1.5 font-mono text-[11px]">{["Home · Hero headline", "Home · 3 service blurbs", "About · Team photos"].map((x) => <div key={x} className="flex justify-between rounded-md border border-border bg-background px-2.5 py-1.5"><span>{x}</span><span className="text-muted-foreground">required</span></div>)}</div>
            </Feature>
            <Feature n="02" t="No account for your client" d="A private link with autosave. They can stop, come back tomorrow, and pick up where they left off.">
              <div className="rounded-md border border-border bg-background p-3 text-xs"><p className="text-muted-foreground">Hero headline</p><p className="mt-1 font-medium">Fresh bread, every morning since 1987<span className="animate-caret">|</span></p><p className="mt-2 font-mono text-[10px] text-seal">● Saved</p></div>
            </Feature>
            <Feature n="03" t="Field-by-field review" d="Approve or send back with a note. Approved fields lock, so nothing changes behind your back.">
              <LockToggle />
            </Feature>
            <Feature n="04" t="Exports that drop in" d="ZIP organized per page, CSV ready for Webflow CMS, JSON for Framer. Images converted to WebP.">
              <ExportPeek />
            </Feature>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl space-y-16 px-6 py-20">
          <SampleExport />
          <div>
            <p className="eyebrow">Time back</p>
            <h2 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">How much does the chase cost you?</h2>
            <div className="mt-8"><SavingsCalc /></div>
          </div>
        </div>
      </section>

      <section id="precos" className="scroll-mt-16 mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <p className="eyebrow">Pricing</p><h2 className="mt-2 font-display text-4xl md:text-5xl">Two plans. No surprises.</h2>
          <div className="mt-6 inline-flex rounded-md border border-border bg-muted p-1 text-sm">
            {(["month", "year"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} className={"rounded px-4 py-1.5 transition-colors " + (billing === b ? "bg-card text-foreground shadow-card font-medium" : "text-muted-foreground")}>{b === "month" ? "Monthly" : "Yearly"}</button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(["solo", "agency"] as const).map((k) => {
            const p = PLANS[k];
            return (
              <div key={k} className={"rounded-lg border bg-card p-8 shadow-card " + (k === "agency" ? "border-primary shadow-float" : "border-border")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  {k === "agency" && <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">Recommended</span>}
                </div>
                <p className="mt-4"><span className="font-display text-5xl">${billing === "month" ? p.month : p.year}</span><span className="text-muted-foreground"> /{billing === "month" ? "month" : "year"}</span></p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {[`${p.requests} active requests`, `${p.users} ${p.users > 1 ? "users" : "user"}`, `${p.storageGb} GB of files`, "Field-by-field approval & lock", "Automatic WebP conversion", "Webflow CSV, Framer JSON & ZIP", "Your logo and color on the portal"].map((f) => <li key={f} className="flex gap-2"><span className="text-seal">✓</span>{f}</li>)}
                </ul>
                <Link to="/comecar" search={{ plano: k, ciclo: billing }} className={"mt-8 block rounded-md py-3 text-center text-sm font-medium " + (k === "agency" ? "bg-primary text-primary-foreground shadow-btn hover:bg-ink-soft" : "border border-border hover:bg-muted")}>Try 14 days</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">During the trial: 1 active request and 500 MB. Cancel in 1 click before day 14 and pay nothing. Prices exclude taxes.</p>
      </section>

      <section id="faq" className="scroll-mt-16 mx-auto max-w-3xl px-6 pb-24">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">Before you add your card.</h2>
        <div className="mt-8"><Faq /></div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-lg bg-primary px-8 py-12 shadow-float text-primary-foreground md:flex-row">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Stop chasing clients for content.</h2>
            <p className="mt-2 text-sm opacity-80">14-day trial. Nothing is charged during the trial.</p>
          </div>
          <Link to="/comecar" className="shrink-0 rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">Start now</Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-2">
            <span className="flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-btn"><Lock className="h-3.5 w-3.5" /></span>Lockcopy</span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Collect, approve and lock client content. Built for web freelancers and agencies.</p>
          </div>
          {[
            ["Product", [["Demo", "#demo"], ["Features", "#como"], ["Pricing", "#precos"]]],
            ["Resources", [["Free templates", "/modelos"], ["Lockcopy vs Content Snare", "/comparar/content-snare"], ["14-day trial", "/comecar"]]],
            ["Legal", [["Privacy", "/privacidade"], ["Terms", "/termos"], ["Data processing", "/dpa"]]],
          ].map(([t, links]) => (
            <div key={t as string}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{t as string}</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {(links as string[][]).map(([l, h]) => <li key={l}><a href={h} className="hover:text-foreground">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span>© 2026 Lockcopy™. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ n, t, d, children }: { n: string; t: string; d: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 bg-card p-8 transition-colors hover:bg-background">
      <div><span className="font-mono text-[11px] text-muted-foreground">{n}</span><h3 className="mt-2 text-lg font-bold tracking-tight">{t}</h3><p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{d}</p></div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}
