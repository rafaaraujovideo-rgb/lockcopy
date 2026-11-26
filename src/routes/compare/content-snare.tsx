import { SiteShell } from "@/components/site-chrome";
import { HScroll } from "@/components/h-scroll";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Card } from "@/components/ui-bits";

export const Route = createFileRoute("/compare/content-snare")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Content Snare alternative for Webflow & Framer agencies — Lockcopy" },
      { name: "description", content: "Content Snare alternative for Webflow and Framer designers: enforced character limits, WebP images, direct Webflow CMS publishing, from $19/month." },
      { property: "og:title", content: "Content Snare alternative for Webflow & Framer agencies — Lockcopy" },
      { property: "og:description", content: "Content Snare alternative for Webflow and Framer designers: enforced character limits, WebP images, direct Webflow CMS publishing, from $19/month." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://lockcopy.com/compare/content-snare" },
      { property: "og:image", content: "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png" },
      { name: "twitter:image", content: "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png" },
    ],
    links: [{ rel: "canonical", href: "https://lockcopy.com/compare/content-snare" }],
  }),
  component: Comparar,
});

const rows: [string, string, string][] = [
  ["Entry price", "Solo $19/month, Agency $39/month, 14-day trial", "Plans start at higher price points"],
  ["Character limits", "Enforced: the client cannot type past the limit", "Check their current features"],
  ["Images", "Converted to WebP (max 2048px) in the client's browser", "Check their current features"],
  ["Client portal", "Direct link, no account, with deadline and reminders", "Also account-free, with reminders"],
  ["Send to Webflow", "Creates CMS drafts directly via the Webflow API, or CSV", "Generic exports; Webflow via integration"],
  ["Export to Framer", "JSON ready to paste into Framer", "Not a focus of the product"],
  ["Organized ZIP", "Files grouped by page and field", "File download per request"],
  ["Field-by-field approval", "Approve or request a change with a note, field by field", "Approval per section/field"],
  ["Team size", "New product, focused on small web agencies", "Established product, more general features"],
];

function Comparar() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Comparisons</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Lockcopy vs Content Snare</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Content Snare is a reference in client content collection. Lockcopy was born smaller and more focused:
        agencies and freelancers who build sites in Webflow or Framer and want content to arrive already in import format.
      </p>

      <Card className="mt-10 overflow-hidden p-0">
        <HScroll hint="Swipe the table to compare →" left={false}>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="sticky left-0 z-10 bg-card p-4 font-medium text-muted-foreground shadow-[inset_-1px_0_0_0_var(--border)]"></th>
              <th className="p-4 font-semibold">Lockcopy</th>
              <th className="p-4 font-semibold">Content Snare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, a, b]) => (
              <tr key={k} className="border-b border-border last:border-0">
                <td className="sticky left-0 z-10 bg-card p-4 font-medium shadow-[inset_-1px_0_0_0_var(--border)]">{k}</td>
                <td className="p-4 text-muted-foreground">{a}</td>
                <td className="p-4 text-muted-foreground">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </HScroll>
      </Card>

      <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl font-semibold text-foreground">When to choose Lockcopy</h2>
        <p>
          If your workflow ends in Webflow or Framer, Lockcopy saves the reformatting step: approved content goes straight into Webflow CMS as
          drafts and the JSON is ready for Framer, with files organized by page in a ZIP.
        </p>
        <h2 className="font-display text-xl font-semibold text-foreground">When Content Snare may make more sense</h2>
        <p>
          If you need a more mature product, with more generic integrations, more client languages and a larger support
          team, Content Snare is a solid, proven choice.
        </p>
        <p className="text-xs">Comparison based on public information available in November 2026; confirm current prices and features on the respective sites.</p>
      </section>

      <div className="mt-12 rounded-lg bg-primary px-8 py-10 text-primary-foreground shadow-float">
        <h2 className="text-2xl font-bold">Try it with no commitment</h2>
        <p className="mt-2 text-sm opacity-80">14-day trial. Nothing is charged during the trial.</p>
        <Link to="/login" search={{ mode: "signup" }} className="mt-5 inline-block rounded-md bg-background shadow-btn px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
          Start the trial
        </Link>
      </div>
    </div>
    </SiteShell>
  );
}
