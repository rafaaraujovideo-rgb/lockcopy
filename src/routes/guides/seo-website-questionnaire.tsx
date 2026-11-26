import { SiteShell } from "@/components/site-chrome";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Card } from "@/components/ui-bits";

const URL = "https://lockcopy.com/guides/seo-website-questionnaire";
const TITLE = "SEO & website content questionnaire for clients (free template) \u2014 Lockcopy";
const DESC = "A free SEO and website content questionnaire for web designers: the exact questions to ask clients before design, with character limits for titles, meta descriptions and headlines.";
const IMG = "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png";

export const Route = createFileRoute("/guides/seo-website-questionnaire")({
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
        headline: "SEO & website content questionnaire",
        description: DESC,
        url: URL,
        author: { "@type": "Organization", name: "Lockcopy", url: "https://lockcopy.com" },
        publisher: { "@type": "Organization", name: "Lockcopy" },
        datePublished: "2026-11-26",
        image: IMG,
      }),
    }],
  }),
  component: SeoQuestionnaire,
});

const INTRO = "The questions to send a client before you design or build a site, so keywords, page titles, meta descriptions and copy arrive ready for the layout. Copy them, or send them as one Lockcopy link with the limits enforced.";

const groups: { title: string; items: [string, string][] }[] = [{"title": "Business and audience", "items": [["What does your business do, in one sentence?", "120 characters"], ["Who is your ideal customer?", "200 characters"], ["Which cities or regions do you serve?", "100 characters"], ["Who are your 3 main competitors (website links)?", "3 links"]]}, {"title": "Search and keywords", "items": [["Which 5 phrases would a customer type into Google to find you?", "5 short phrases"], ["Which services or products matter most for revenue?", "200 characters"], ["Do you have an existing site whose pages should keep their URLs?", "Yes / no + link"]]}, {"title": "Page titles and descriptions", "items": [["Home page title", "60 characters"], ["Home page meta description", "155 characters"], ["Main headline (H1) for the home page", "70 characters"], ["One meta description per service page", "155 characters each"]]}, {"title": "Trust and content", "items": [["3 customer reviews you have permission to use", "300 characters each"], ["Awards, certifications or press mentions", "200 characters"], ["Logo (SVG or PNG) and team photos", "Files"], ["Google Business Profile link", "1 link"]]}];

function SeoQuestionnaire() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Guides</p>
      <h1 className="mt-3 font-display text-4xl font-bold">SEO &amp; website content questionnaire</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{INTRO}</p>

      <section className="mt-10 space-y-6">
        {groups.map((g) => (
          <Card key={g.title} className="p-6">
            <h2 className="font-display text-lg font-semibold">{g.title}</h2>
            <ul className="mt-3 divide-y divide-border">
              {g.items.map(([q, limit]) => (
                <li key={q} className="flex items-start justify-between gap-4 py-2 text-sm">
                  <span className="text-foreground">{q}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{limit}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      <section className="mt-12 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl font-semibold text-foreground">Why the character limits matter</h2>
        <p>Google cuts titles at around 60 characters and descriptions at around 155. A headline written without a limit also breaks the layout you designed. Asking with the limit up front saves a round of rewrites.</p>
        <p>More ready-made lists: <Link to="/templates" className="font-medium text-foreground underline underline-offset-4">website content templates</Link> and <Link to="/guides/client-content-email-templates" className="font-medium text-foreground underline underline-offset-4">emails to ask clients for content</Link>.</p>
      </section>

      <div className="mt-12 rounded-lg bg-primary px-8 py-10 text-primary-foreground shadow-float">
        <h2 className="text-2xl font-bold">Send this questionnaire as one link</h2>
        <p className="mt-2 text-sm opacity-80">Lockcopy sends one link with character limits, saves progress and reminds the client for you. 14-day trial, no card.</p>
        <Link to="/login" search={{ mode: "signup" }} className="mt-5 inline-block rounded-md bg-background shadow-btn px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
          Start the trial
        </Link>
      </div>
    </div>
    </SiteShell>
  );
}
