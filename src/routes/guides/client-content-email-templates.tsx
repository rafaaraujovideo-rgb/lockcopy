import { SiteShell } from "@/components/site-chrome";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Card } from "@/components/ui-bits";

const URL = "https://lockcopy.com/guides/client-content-email-templates";
const TITLE = "Email templates to ask clients for website content \u2014 Lockcopy";
const DESC = "Copy-ready emails for web designers: kickoff content request, friendly reminder, deadline reminder and project-on-hold notice, so clients send their copy and photos on time.";
const IMG = "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png";

export const Route = createFileRoute("/guides/client-content-email-templates")({
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
        headline: "Email templates to ask clients for website content",
        description: DESC,
        url: URL,
        author: { "@type": "Organization", name: "Lockcopy", url: "https://lockcopy.com" },
        publisher: { "@type": "Organization", name: "Lockcopy" },
        datePublished: "2026-11-26",
        image: IMG,
      }),
    }],
  }),
  component: EmailTemplates,
});

const INTRO = "Four short emails that cover the whole content chase, from kickoff to a stalled project. Replace the words in brackets and send.";

const emails: { title: string; subject: string; body: string }[] = [{"title": "1. Kickoff: asking for content", "subject": "Content for your new website", "body": "Hi [Name],\n\nTo start building your site, I need the texts and photos for each page. I've listed exactly what goes where, with a short example for each field: [link].\n\nCould you have it ready by [date]? Your progress saves as you go, so you can do it in a few sittings.\n\nThanks,\n[Your name]"}, {"title": "2. Friendly reminder (3 days before)", "subject": "Quick reminder: website content due [date]", "body": "Hi [Name],\n\nJust a reminder that the website content is due on [date]. You've finished [X] of [Y] items, and the rest is here: [link].\n\nIf any field is unclear, reply to this email and I'll help.\n\n[Your name]"}, {"title": "3. Deadline day", "subject": "Today: the last items for your website", "body": "Hi [Name],\n\nToday is the content deadline. Still missing: [list of items]. Once these arrive I can move to the build stage and keep the launch date of [launch date].\n\n[Link]\n\n[Your name]"}, {"title": "4. Project on hold", "subject": "Your website is paused until content arrives", "body": "Hi [Name],\n\nThe design is ready, but I can't finish the build without the remaining content. I've paused the project for now, and the launch date will move by however long the content takes.\n\nAs soon as you send the missing items here, I'll pick it back up: [link].\n\n[Your name]"}];

function EmailTemplates() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Guides</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Email templates to ask clients for website content</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{INTRO}</p>

      <section className="mt-10 space-y-6">
        {emails.map((e) => (
          <Card key={e.title} className="p-6">
            <h2 className="font-display text-lg font-semibold">{e.title}</h2>
            <p className="mt-2 text-xs text-muted-foreground">Subject: <span className="text-foreground">{e.subject}</span></p>
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm leading-relaxed text-foreground">{e.body}</pre>
          </Card>
        ))}
      </section>

      <section className="mt-12 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl font-semibold text-foreground">Make every email point to one link</h2>
        <p>Each email works better when it links to one place that lists every missing item. Need the questions themselves? Use the <Link to="/guides/seo-website-questionnaire" className="font-medium text-foreground underline underline-offset-4">SEO & website content questionnaire</Link>.</p>
      </section>

      <div className="mt-12 rounded-lg bg-primary px-8 py-10 text-primary-foreground shadow-float">
        <h2 className="text-2xl font-bold">Stop sending these by hand</h2>
        <p className="mt-2 text-sm opacity-80">Lockcopy sends one link with character limits, saves progress and reminds the client for you. 14-day trial, no card.</p>
        <Link to="/login" search={{ mode: "signup" }} className="mt-5 inline-block rounded-md bg-background shadow-btn px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
          Start the trial
        </Link>
      </div>
    </div>
    </SiteShell>
  );
}
