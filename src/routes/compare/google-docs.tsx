import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-chrome";
import { HeroStage } from "@/components/hero-stage";
import { HScroll } from "@/components/h-scroll";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/store";

const title = "Google Docs alternative for website content collection — Lockcopy";
const description = "Collect website copy and photos without scattered Google Docs and Drive folders. Compare character limits, client reminders, approvals and Webflow CMS delivery.";
const url = "https://lockcopy.com/compare/google-docs";

export const Route = createFileRoute("/compare/google-docs")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org", "@type": "Article", headline: title,
      description, mainEntityOfPage: url, author: { "@type": "Organization", name: "Lockcopy", url: "https://lockcopy.com" },
    }) }],
  }),
  component: GoogleDocsComparison,
});

const rows = [
  ["Writing and collaboration", "Rich document editing, comments and version history", "Structured answers for each website page and field"],
  ["Character limits", "Word count helps you check length; instructions are not enforced input limits", "The client cannot type past the limit you set"],
  ["Photos", "Drive stores the uploaded files; resize and convert them separately", "Supported photos are optimized to WebP in the client's browser"],
  ["Client access", "Depends on your sharing settings; some actions require a Google account", "A private link, with no client account required"],
  ["Missing content", "Track gaps in your document or a separate checklist", "Per-field status and request progress"],
  ["Follow-up", "Send your own emails or add a separate automation", "Deadline-based automatic reminders and a manual reminder button"],
  ["Approval", "Comments, suggestions and your own sign-off convention", "Approve individual fields or request a change with a note"],
  ["Webflow delivery", "Copy content manually or build your own integration", "Map fields to a collection and create Webflow CMS drafts using an API token"],
];

function GoogleDocsComparison() {
  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Comparisons</p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight md:text-5xl">Google Docs alternative for website content collection</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">Google Docs is great for writing together. Lockcopy is for collecting the final copy and photos for a website: one client link, limits that protect your layout, and a clear approval status for every field.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button asChild><Link to="/login" search={{ mode: "signup" }}>Start your free trial <ArrowRight /></Link></Button>
            <span className="text-xs text-muted-foreground">14 days free · no credit card</span>
          </div>
          <div className="mt-10"><HeroStage /></div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="font-display text-2xl font-semibold">Google Docs + Drive vs Lockcopy</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Compare the workflow, not just the subscription. Docs and Drive can work well; the difference is how much checking, chasing and preparation you handle yourself.</p>
          <div className="mt-6 overflow-hidden rounded-md border border-border">
            <HScroll hint="Swipe to compare →" left={false}>
              <table className="w-full min-w-[660px] text-left text-sm">
                <caption className="sr-only">Website content collection with Google Docs and Drive compared with Lockcopy</caption>
                <thead className="bg-muted"><tr><th scope="col" className="p-4">Workflow</th><th scope="col" className="p-4">Google Docs + Drive</th><th scope="col" className="p-4">Lockcopy</th></tr></thead>
                <tbody>{rows.map(([label, docs, lockcopy]) => <tr key={label} className="border-t border-border"><th scope="row" className="p-4 align-top font-medium">{label}</th><td className="p-4 align-top leading-relaxed text-muted-foreground">{docs}</td><td className="p-4 align-top leading-relaxed text-muted-foreground">{lockcopy}</td></tr>)}</tbody>
              </table>
            </HScroll>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl font-semibold">Keep Docs for drafting</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">If you are co-writing long-form copy, need tracked suggestions, or only collect content occasionally, a well-structured document and Drive folder may be enough. Consumer Google accounts include Docs and a free storage allowance; Google Workspace and additional storage are paid separately.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Lockcopy is not a full document editor or a replacement for your team's entire Drive.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold">Use Lockcopy for the handoff</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">It fits freelancers and small web agencies repeatedly collecting client content. Use it when checking text lengths, preparing photos and tracking missing answers have become part of every project.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Solo is ${PLANS.solo.month}/month and Agency is ${PLANS.agency.month}/month. Whether it is worth paying for depends on the manual work it replaces in your projects, not a guaranteed number of hours saved.</p>
          </section>
        </div>
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-semibold">Move your next website request out of scattered documents</h2>
          <ol className="mt-5 grid gap-6 text-sm leading-relaxed md:grid-cols-3">
            <li><span className="font-semibold">1. Set up the pages.</span><p className="mt-2 text-muted-foreground">Choose a website template, edit the fields and set the character limits for your layout.</p></li>
            <li><span className="font-semibold">2. Send one client link.</span><p className="mt-2 text-muted-foreground">Your client pastes their final text and uploads photos. Answers save automatically.</p></li>
            <li><span className="font-semibold">3. Review and deliver.</span><p className="mt-2 text-muted-foreground">Approve the fields, download an organized ZIP, or map content to Webflow CMS drafts.</p></li>
          </ol>
          <p className="mt-5 text-sm text-muted-foreground">There is no automatic Google Docs or Drive import. Existing content must be pasted or uploaded. Webflow publishing is for CMS collections, not automatic placement on static pages; Framer exports still require manual use.</p>
        </section>
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-semibold">Start with a structured content checklist</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm">
            <Link to="/templates/$slug" params={{ slug: "website-content-questionnaire" }} className="underline underline-offset-4 hover:text-primary">Website content questionnaire</Link>
            <Link to="/guides/collect-website-content" className="underline underline-offset-4 hover:text-primary">How to collect content from web design clients</Link>
            <Link to="/guides/client-content-email-templates" className="underline underline-offset-4 hover:text-primary">Emails to request missing website content</Link>
          </div>
          <div className="mt-6"><Button asChild><Link to="/login" search={{ mode: "signup" }}>Start 14-day trial <ArrowRight /></Link></Button></div>
        </section>
      </div>
    </SiteShell>
  );
}