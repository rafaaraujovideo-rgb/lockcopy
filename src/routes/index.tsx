import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PLANS } from "@/lib/store";
import { Lock, Menu, X } from "lucide-react";
import { LandingDemo } from "@/components/landing-demo";

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
          <a href="#" className="flex items-center gap-2 text-lg font-bold tracking-tight"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground"><Lock className="h-3.5 w-3.5" /></span>Lockcopy</a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#demo" className="hover:text-foreground">Demo</a>
            <a href="#como" className="hover:text-foreground">Features</a>
            <a href="#precos" className="hover:text-foreground">Pricing</a>
            <Link to="/entrar" search={{ modo: "criar", seguir: "/app" }} className="hover:text-foreground">Create account</Link>
          </nav>
          <div className="hidden items-center gap-2 text-sm md:flex">
            <Link to="/entrar" className="rounded-full px-4 py-2 text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/comecar" className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90">Try for free</Link>
          </div>
          <button aria-label="Menu" onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm" onClick={() => setOpen(false)}>
              <a href="#demo">Demo</a><a href="#como">Features</a><a href="#precos">Pricing</a>
              <Link to="/entrar" search={{ modo: "criar", seguir: "/app" }}>Create account</Link>
              <div className="mt-2 flex gap-2">
                <Link to="/entrar" className="flex-1 rounded-full border border-border py-2 text-center">Sign in</Link>
                <Link to="/comecar" className="flex-1 rounded-full bg-primary py-2 text-center font-medium text-primary-foreground">Try it</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">For web freelancers and agencies</p>
        <h1 className="mt-6 font-display text-4xl leading-[1.1] md:text-6xl">
          Client content,<br /><span className="text-seal">organized and approved.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Send a link. The client fills in texts and uploads files, page by page, with no account. You review, approve and export to Webflow or Framer.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/comecar" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Start 14-day trial</Link>
          <a href="#demo" className="rounded-full border border-border bg-card px-6 py-3 text-sm hover:bg-muted">See what the client sees</a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Card required upfront. Nothing is charged during the 14 days.</p>
      </section>

      <section id="demo" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
        <p className="mb-6 text-center text-sm text-muted-foreground">See how it works — click each step and try it.</p>
        <LandingDemo />
      </section>

      <section id="como" className="scroll-mt-16 border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-4">
          {[
            ["Per-page templates", "Business site, landing, e-commerce and rebranding, ready to send."],
            ["No account for the client", "A private link with autosave and file uploads."],
            ["Field-by-field review", "Approve or request a change with a note. Approved stays locked."],
            ["Clean export", "ZIP per page, CSV for Webflow and JSON for Framer."],
          ].map(([t, d], i) => (
            <div key={t}>
              <span className="text-xs text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precos" className="scroll-mt-16 mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-display text-5xl">Simple pricing</h2>
          <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 text-sm">
            {(["month", "year"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} className={"rounded-full px-4 py-1.5 transition-colors " + (billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{b === "month" ? "Monthly" : "Yearly"}</button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(["solo", "agency"] as const).map((k) => {
            const p = PLANS[k];
            return (
              <div key={k} className={"rounded-2xl border bg-card p-8 shadow-card " + (k === "agency" ? "border-primary/30" : "border-border")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  {k === "agency" && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">Recommended</span>}
                </div>
                <p className="mt-4"><span className="font-display text-5xl">${billing === "month" ? p.month : p.year}</span><span className="text-muted-foreground"> /{billing === "month" ? "month" : "year"}</span></p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li>{p.requests} active requests</li><li>{p.users} {p.users > 1 ? "users" : "user"}</li><li>{p.storageGb} GB of files</li>
                </ul>
                <Link to="/comecar" search={{ plano: k, ciclo: billing }} className={"mt-8 block rounded-full py-3 text-center text-sm font-medium " + (k === "agency" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted")}>Try 14 days</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">During the trial: 1 active request and 500 MB. Prices exclude taxes.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-primary px-8 py-10 text-primary-foreground md:flex-row">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Stop chasing clients for content.</h2>
            <p className="mt-2 text-sm opacity-80">14-day trial. Nothing is charged during the trial.</p>
          </div>
          <Link to="/comecar" className="shrink-0 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">Start now</Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-2">
            <span className="flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground"><Lock className="h-3.5 w-3.5" /></span>Lockcopy</span>
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
