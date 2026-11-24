import { SiteShell } from "@/components/site-chrome";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Card } from "@/components/ui-bits";

const URL = "https://lockcopy.com/guides/collect-website-content";
const TITLE = "How to collect website content from clients (without chasing) — Lockcopy";
const DESC = "A practical guide for Webflow and Framer designers: how to get every text and photo from clients on time, with a per-page checklist, deadlines, reminders and field-by-field approval.";
const IMG = "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png";

export const Route = createFileRoute("/guides/collect-website-content")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: IMG },
      { name: "twitter:image", content: IMG },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "How to collect website content from clients",
        description: DESC,
        url: URL,
        author: { "@type": "Organization", name: "Lockcopy", url: "https://lockcopy.com" },
        publisher: { "@type": "Organization", name: "Lockcopy" },
        datePublished: "2026-11-24",
        image: IMG,
      }),
    }],
  }),
  component: Guide,
});

const steps: { title: string; body: string }[] = [
  { title: "1. Ask for content before design starts", body: "Put content collection in your contract and kickoff call. Agree on who writes the copy, who supplies the photos and the date it is due. A project without a content deadline is a project without an end date." },
  { title: "2. Ask page by page, field by field", body: "\"Send me the texts\" gets you a 12-page Word document or nothing. List every page of the site and, inside each one, the exact fields you need: headline, intro paragraph, team photo, logo in SVG. Add a character limit where the layout needs one." },
  { title: "3. Show an example for every field", body: "Clients freeze in front of a blank box. A one-line hint (\"e.g. 'Family dentist in Porto since 1998'\") turns a week of silence into a five-minute answer." },
  { title: "4. Use one link, not email threads", body: "Files spread across email, WhatsApp and Google Drive are how projects stall. Give the client one place to fill in, with no account to create, so the answer always lands in the same spot." },
  { title: "5. Set a deadline and automate reminders", body: "Most delays are not refusals, they are forgetting. A reminder a few days before the deadline, one on the day and one after it does the chasing for you, without you sounding like a debt collector." },
  { title: "6. Review and approve each field", body: "Approve what is ready and send back only what needs a change, with a short note. The client fixes one field instead of resending everything, and you always know what is still missing." },
  { title: "7. Export straight into your build", body: "Once everything is approved, move the content into Webflow CMS or Framer in one go: a CSV for Webflow collections, JSON for Framer, and images grouped by page. No copy-paste from emails." },
];

function Guide() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Guides</p>
      <h1 className="mt-3 font-display text-4xl font-bold">How to collect website content from clients</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The site is designed, the build is ready, and you are still waiting for the client's copy and photos. This is the most
        common reason web projects stall for weeks. Here is a simple process Webflow and Framer designers use to get content on time.
      </p>

      <Card className="mt-10 p-6">
        <h2 className="font-display text-lg font-semibold">The short version</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ask early, ask page by page with examples, use one link, set a deadline with automatic reminders, approve field by field, then export straight into your CMS.
        </p>
      </Card>

      <section className="mt-12 space-y-8">
        {steps.map((s) => (
          <div key={s.title}>
            <h2 className="font-display text-xl font-semibold text-foreground">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl font-semibold text-foreground">Start with a ready-made checklist</h2>
        <p>
          Not sure which fields to ask for? Our <Link to="/templates" className="font-medium text-foreground underline underline-offset-4">free website content checklist templates</Link> cover
          the usual pages (home, about, services, contact) and can be downloaded as CSV.
        </p>
      </section>

      <div className="mt-12 rounded-lg bg-primary px-8 py-10 text-primary-foreground shadow-float">
        <h2 className="text-2xl font-bold">Do all of this from one link</h2>
        <p className="mt-2 text-sm opacity-80">Lockcopy runs this whole process for you. 14-day trial, no card.</p>
        <Link to="/login" search={{ mode: "signup" }} className="mt-5 inline-block rounded-md bg-background shadow-btn px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
          Start the trial
        </Link>
      </div>
    </div>
    </SiteShell>
  );
}
