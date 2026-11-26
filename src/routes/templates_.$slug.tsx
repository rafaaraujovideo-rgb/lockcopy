import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-chrome";
import { Card } from "@/components/ui-bits";
import { findSeoTemplate, SEO_TEMPLATES } from "@/lib/seo-templates";

export const Route = createFileRoute("/templates_/$slug")({
  staticData: { sitemap: true },
  loader: ({ params }) => {
    const t = findSeoTemplate(params.slug);
    if (!t) throw notFound();
    return t;
  },
  head: ({ params, loaderData }) => {
    const url = `https://lockcopy.com/templates/${params.slug}`;
    if (!loaderData) return { meta: [{ title: "Template not found — Lockcopy" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: loaderData.title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Templates", item: "https://lockcopy.com/templates" },
            { "@type": "ListItem", position: 2, name: loaderData.keyword, item: url },
          ],
        }),
      }],
    };
  },
  notFoundComponent: () => (
    <SiteShell><div className="mx-auto max-w-3xl px-6 py-24"><h1 className="font-display text-3xl font-bold">Template not found</h1>
      <Link to="/templates" className="mt-4 inline-block text-sm underline">See all templates</Link></div></SiteShell>
  ),
  component: TemplatePage,
});

function TemplatePage() {
  const t = Route.useLoaderData();
  const pages = [...new Set(t.fields.map((f) => f.page))];
  const others = SEO_TEMPLATES.filter((x) => x.slug !== t.slug);
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm text-muted-foreground">
          <Link to="/templates" className="hover:text-foreground">Templates</Link> · Free
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold">{t.keyword}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.intro}</p>

        <div className="mt-10 space-y-6">
          {pages.map((p) => (
            <Card key={p} className="p-0">
              <h2 className="border-b border-border px-5 py-3 font-display text-base font-semibold">{p}</h2>
              <ul className="divide-y divide-border">
                {t.fields.filter((f) => f.page === p).map((f) => (
                  <li key={f.label} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.note}</p>
                    </div>
                    <p className="shrink-0 font-mono text-xs text-muted-foreground">
                      {f.type}{f.limit ? ` · max ${f.limit} chars` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <section className="mt-12 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-display text-xl font-semibold text-foreground">How to use it</h2>
          <ul className="list-disc space-y-2 pl-5">{t.tips.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>

        <div className="mt-12 rounded-lg bg-primary px-8 py-10 text-primary-foreground shadow-float">
          <h2 className="text-2xl font-bold">Send this as a link, with the limits enforced</h2>
          <p className="mt-2 max-w-xl text-sm opacity-80">
            In Lockcopy the client fills it without an account, cannot go over the character limits, and photos arrive as WebP.
            You approve field by field and send it to Webflow CMS. 14-day trial.
          </p>
          <Link to="/login" search={{ mode: "signup" }} className="mt-5 inline-block rounded-md bg-background shadow-btn px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
            Use this template
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-lg font-semibold">Other templates</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {others.map((o) => (
              <li key={o.slug}><Link to="/templates/$slug" params={{ slug: o.slug }} className="underline-offset-4 hover:underline">{o.keyword}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
