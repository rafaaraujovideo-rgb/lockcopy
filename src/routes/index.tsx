import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type React from "react";
import { PLANS } from "@/lib/store";
import { Lock } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { HeroStage } from "@/components/hero-stage";
import { LandingDemo } from "@/components/landing-demo";
import { BeforeAfter, SampleExport, SavingsCalc, StackBar, WebpTry, Faq, LockToggle, ExportPeek } from "@/components/landing-sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lockcopy · Collect website content from clients" },
      { name: "description", content: "Per-page checklists, organized uploads and export to Webflow and Framer. For web freelancers and agencies." },
      { property: "og:title", content: "Lockcopy · Collect website content from clients" },
      { property: "og:description", content: "Per-page checklists, organized uploads and export to Webflow and Framer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [billing, setBilling] = useState<"month" | "year">("month");
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground shadow-card"><span className="h-1.5 w-1.5 rounded-full bg-seal" />For web designers and agencies</span>
            <h1 className="mt-7 font-display text-[2.6rem] leading-[1.02] md:text-[4.6rem]">
              Client content for your website projects,<br /><span className="text-muted-foreground">in one place.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Send your client a link with a checklist for each page. They add the text and photos without signing up. You approve each item and export it to Webflow, Framer or a ZIP file.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/start" className="press rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-btn hover:bg-ink-soft">Start 14-day trial</Link>
              <a href="#demo" className="press rounded-md border border-border bg-card px-5 py-3 text-sm font-medium shadow-card hover:bg-muted">Try the demo ↓</a>
            </div>
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">14 days free · no credit card</p>
          </div>
          <div className="mt-14"><HeroStage /></div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8"><StackBar /></div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow">The problem</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">Content usually arrives by email, in pieces.</h2>
          <div className="mt-10"><BeforeAfter /></div>
        </div>
      </section>

      <section id="demo" className="scroll-mt-20 border-b border-border bg-muted/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow">Live demo</p><h2 className="mt-2 font-display text-3xl md:text-4xl">See how a request works.</h2></div>
            <p className="max-w-xs text-sm text-muted-foreground">Four steps, using the same screens as the app.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 shadow-float"><LandingDemo /></div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="eyebrow">What you get</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">What's included</h2>
          <div className="mt-12 grid overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2" style={{ gap: 1 }}>
            <Feature n="01" t="Per-page templates" d="Templates for a business site, landing page, online store and rebrand. Each page lists the text and files you need.">
              <div className="space-y-1.5 font-mono text-[11px]">{["Home · Hero headline", "Home · 3 service blurbs", "About · Team photos"].map((x) => <div key={x} className="flex justify-between rounded-md border border-border bg-background px-2.5 py-1.5"><span>{x}</span><span className="text-muted-foreground">required</span></div>)}</div>
            </Feature>
            <Feature n="02" t="No account for your client" d="Your client opens a private link. Answers save as they type, so they can finish later.">
              <div className="rounded-md border border-border bg-background p-3 text-xs"><p className="text-muted-foreground">Hero headline</p><p className="mt-1 font-medium">Fresh bread, every morning since 1987<span className="animate-caret">|</span></p><p className="mt-2 font-mono text-[10px] text-seal">● Saved</p></div>
            </Feature>
            <Feature n="03" t="Field-by-field review" d="Approve each answer or ask for a change with a note. Approved answers are locked and can't be edited.">
              <LockToggle />
            </Feature>
            <Feature n="04" t="Exports for your site builder" d="A ZIP with a folder per page, a CSV for the Webflow CMS and a JSON file for Framer. Images are converted to WebP.">
              <ExportPeek />
            </Feature>
            <div className="md:col-span-2"><Feature n="05" t="Smaller images" d="Images your client uploads are converted to WebP. You can try it here with one of your photos.">
              <WebpTry />
            </Feature></div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl space-y-16 px-6 py-20">
          <SampleExport />
          <div>
            <p className="eyebrow">Time</p>
            <h2 className="mt-2 max-w-xl font-display text-3xl md:text-4xl">How much time do you spend asking for content?</h2>
            <div className="mt-8"><SavingsCalc /></div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-16 mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <p className="eyebrow">Pricing</p><h2 className="mt-2 font-display text-4xl md:text-5xl">Pricing</h2>
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
                <Link to="/start" search={{ plan: k, cycle: billing }} className={"mt-8 block rounded-md py-3 text-center text-sm font-medium " + (k === "agency" ? "bg-primary text-primary-foreground shadow-btn hover:bg-ink-soft" : "border border-border hover:bg-muted")}>Try 14 days</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">During the 14-day trial you get the full Solo plan, with no credit card. Add a card only if you want to continue. Prices exclude taxes.</p>
      </section>

      <section id="faq" className="scroll-mt-16 mx-auto max-w-3xl px-6 pb-24">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">Common questions</h2>
        <div className="mt-8"><Faq /></div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-lg bg-primary px-8 py-12 shadow-float text-primary-foreground md:flex-row">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Try Lockcopy on your next project.</h2>
            <p className="mt-2 text-sm opacity-80">14 days free. You only pay if you add a card.</p>
          </div>
          <Link to="/start" className="shrink-0 rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">Start now</Link>
        </div>
      </section>

      <SiteFooter />
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
