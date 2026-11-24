import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type React from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";

const nav = [
  { label: "Features", hash: "features" },
  { label: "Pricing", hash: "pricing" },
] as const;

const navLink = "rounded-md px-3 py-1.5 transition-colors hover:bg-card hover:text-foreground";
const active = { className: "text-foreground font-medium" };

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" aria-label="Lockcopy home"><Logo className="text-lg" /></Link>
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {nav.map((n) => <Link key={n.hash} to="/" hash={n.hash} className={navLink}>{n.label}</Link>)}
          <Link to="/templates" className={navLink} activeProps={active}>Templates</Link>
          <Link to="/compare/content-snare" className={navLink} activeProps={active}>Compare</Link>
        </nav>
        <div className="hidden items-center gap-2 text-sm md:flex">
          <Link to="/login" className="rounded-md px-4 py-2 text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/start" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-btn hover:bg-ink-soft">Try for free</Link>
        </div>
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1 text-sm" onClick={() => setOpen(false)}>
            {nav.map((n) => <Link key={n.hash} to="/" hash={n.hash} className="py-2">{n.label}</Link>)}
            <Link to="/templates" className="py-2">Templates</Link>
            <Link to="/compare/content-snare" className="py-2">Compare</Link>
            <div className="mt-3 flex gap-2">
              <Link to="/login" className="flex-1 rounded-md border border-border py-2 text-center">Sign in</Link>
              <Link to="/start" className="flex-1 rounded-md bg-primary py-2 text-center font-medium text-primary-foreground shadow-btn">Try for free</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

const fl = "transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo className="text-lg" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Collect, approve and lock client content. Built for web freelancers and agencies.</p>
          <Link to="/start" className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-btn hover:bg-ink-soft">Start 14-day trial</Link>
        </div>
        <FooterCol title="Product">
          {nav.map((n) => <li key={n.hash}><Link to="/" hash={n.hash} className={fl}>{n.label}</Link></li>)}
          <li><Link to="/login" className={fl}>Sign in</Link></li>
        </FooterCol>
        <FooterCol title="Resources">
          <li><Link to="/templates" className={fl}>Free templates</Link></li>
          <li><Link to="/compare/content-snare" className={fl}>Lockcopy vs Content Snare</Link></li>
          <li><a href="mailto:rafaaraujo.video@gmail.com" className={fl}>Contact support</a></li>
        </FooterCol>
        <FooterCol title="Legal">
          <li><Link to="/privacy" className={fl}>Privacy</Link></li>
          <li><Link to="/terms" className={fl}>Terms</Link></li>
          <li><Link to="/dpa" className={fl}>Data processing</Link></li>
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Lockcopy. All rights reserved.</span>
          <span>Secure payments by Stripe</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">{children}</ul>
    </div>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
