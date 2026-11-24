import { SiteShell } from "@/components/site-chrome";
import { HScroll } from "@/components/h-scroll";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Card } from "@/components/ui-bits";

export const Route = createFileRoute("/compare/file-request-pro")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "File Request Pro alternative for Webflow & Framer agencies — Lockcopy" },
      { name: "description", content: "Looking for a File Request Pro alternative? Collect structured website copy and images page by page, approve each field and export to Webflow CSV or Framer JSON." },
      { property: "og:title", content: "File Request Pro alternative for Webflow & Framer agencies — Lockcopy" },
      { property: "og:description", content: "Looking for a File Request Pro alternative? Collect structured website copy and images page by page, approve each field and export to Webflow CSV or Framer JSON." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://lockcopy.com/compare/file-request-pro" },
      { property: "og:image", content: "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png" },
      { name: "twitter:image", content: "https://lockcopy.com/__l5e/assets-v1/f34de8e1-53db-4fe4-b79f-315644e44562/lockcopy-share.png" },
    ],
    links: [{ rel: "canonical", href: "https://lockcopy.com/compare/file-request-pro" }],
  }),
  component: CompareFileRequestPro,
});

const rows: [string, string, string][] = [
  ["What you collect", "Structured website content: copy per page and field, plus images and files", "Files uploaded through request links and forms"],
  ["Built around", "Each page of the website your client needs content for", "A file request or upload form"],
  ["Client account", "None: a private link with a deadline and reminders", "None needed to upload"],
  ["Review", "Approve or request a change with a note, field by field", "Review the uploaded files"],
  ["Export to Webflow", "CSV in Webflow's CMS import format, per page", "Files go to your storage; mapping to Webflow is manual"],
  ["Export to Framer", "JSON ready to paste into Framer", "Not a focus of the product"],
  ["Organized ZIP", "Files grouped by page and field, images as WebP", "Files saved to your connected cloud storage"],
];

function CompareFileRequestPro() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Comparisons</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Lockcopy vs File Request Pro</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        File Request Pro is built to collect files from clients. Lockcopy is built to collect a whole website's content:
        the copy for every page and field, together with the images, already in the format Webflow or Framer imports.
      </p>

      <Card className="mt-10 overflow-hidden p-0">
        <HScroll hint="Swipe the table to compare →" left={false}>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="sticky left-0 z-10 bg-card p-4 font-medium text-muted-foreground shadow-[inset_-1px_0_0_0_var(--border)]"></th>
              <th className="p-4 font-semibold">Lockcopy</th>
              <th className="p-4 font-semibold">File Request Pro</th>
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
          If you are building a website and need your client's copy as well as their photos, Lockcopy gives them a checklist
          per page. You approve each answer, then export a CSV for the Webflow CMS, a JSON file for Framer or an organized ZIP.
        </p>
        <h2 className="font-display text-xl font-semibold text-foreground">When File Request Pro may make more sense</h2>
        <p>
          If you mainly need clients to upload files straight into your own cloud storage, outside of website projects,
          File Request Pro is a focused, proven choice.
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
