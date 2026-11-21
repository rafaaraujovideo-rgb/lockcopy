import { createFileRoute, Link } from "@tanstack/react-router";

import { downloadTemplate, FREE_TEMPLATES } from "@/lib/free-templates";
import { Card } from "@/components/ui-bits";

export const Route = createFileRoute("/modelos")({
  head: () => ({
    meta: [
      { title: "Modelos gratuitos de checklist de conteúdos — Lockcopy" },
      { name: "description", content: "Checklists prontas em CSV para pedir textos e imagens aos clientes: site institucional, loja online e landing page." },
      { property: "og:title", content: "Modelos gratuitos de checklist de conteúdos — Lockcopy" },
      { property: "og:description", content: "Checklists prontas em CSV para pedir textos e imagens aos clientes: site institucional, loja online e landing page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Modelos,
});

function Modelos() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Recursos gratuitos</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Modelos de checklist de conteúdos</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Checklists prontas a usar para pedir textos e imagens aos clientes, no mesmo formato que a Lockcopy exporta para o Webflow.
        Descarregue em CSV, abra no Excel ou no Google Sheets e ajuste ao projeto. Sem conta, sem email.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {FREE_TEMPLATES.map((t) => (
          <Card key={t.slug}>
            <h2 className="font-display text-lg font-semibold">{t.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">{t.rows.length} campos · CSV (Excel / Google Sheets)</p>
            <button
              onClick={() => downloadTemplate(t)}
              className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Descarregar CSV
            </button>
          </Card>
        ))}
      </div>
      <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="font-display text-2xl font-semibold">Quer que o cliente preencha isto sozinho?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Na Lockcopy estes modelos viram um portal com link, prazo e lembretes automáticos — e cada resposta fica pronta a exportar.
        </p>
        <Link to="/comecar" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Experimentar 14 dias
        </Link>
      </div>
    </div>
  );
}
