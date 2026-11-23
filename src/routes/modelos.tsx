import { createFileRoute, Link } from "@tanstack/react-router";

import { downloadTemplate, FREE_TEMPLATES } from "@/lib/free-templates";
import { Card } from "@/components/ui-bits";

export const Route = createFileRoute("/modelos")({
  head: () => ({
    meta: [
      { title: "Free content checklist templates — Lockcopy" },
      { name: "description", content: "Ready-made CSV checklists to request texts and images from clients: business website, online store and landing page." },
      { property: "og:title", content: "Free content checklist templates — Lockcopy" },
      { property: "og:description", content: "Ready-made CSV checklists to request texts and images from clients: business website, online store and landing page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Modelos,
});

function Modelos() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Free resources</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Content checklist templates</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Ready-to-use checklists for requesting texts and images from clients, in the same format Lockcopy exports to Webflow.
        Download as CSV, open in Excel or Google Sheets and adjust to the project. No account, no email.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {FREE_TEMPLATES.map((t) => (
          <Card key={t.slug}>
            <h2 className="font-display text-lg font-semibold">{t.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">{t.rows.length} fields · CSV (Excel / Google Sheets)</p>
            <button
              onClick={() => downloadTemplate(t)}
              className="mt-5 w-full rounded-md bg-primary shadow-btn py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Download CSV
            </button>
          </Card>
        ))}
      </div>
      <div className="mt-12 rounded-lg border border-border bg-card p-8 shadow-card">
        <h2 className="font-display text-2xl font-semibold">Want the client to fill this in by themselves?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          In Lockcopy these templates become a portal with a link, a deadline and automatic reminders — and every answer is ready to export.
        </p>
        <Link to="/comecar" className="mt-5 inline-block rounded-md bg-primary shadow-btn px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Try 14 days
        </Link>
      </div>
    </div>
  );
}
