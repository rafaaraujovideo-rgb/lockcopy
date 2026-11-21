import { createFileRoute, Link } from "@tanstack/react-router";

import { Card } from "@/components/ui-bits";

export const Route = createFileRoute("/comparar/content-snare")({
  head: () => ({
    meta: [
      { title: "Lockcopy vs Content Snare — comparação honesta" },
      { name: "description", content: "Comparação entre Lockcopy e Content Snare para recolha de conteúdos de clientes: preço, exportações Webflow/Framer e portais sem conta." },
      { property: "og:title", content: "Lockcopy vs Content Snare — comparação honesta" },
      { property: "og:description", content: "Comparação entre Lockcopy e Content Snare para recolha de conteúdos de clientes: preço, exportações Webflow/Framer e portais sem conta." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comparar,
});

const rows: [string, string, string][] = [
  ["Preço de entrada", "Plano solo acessível, com 14 dias de teste", "Planos a partir de valores mais altos"],
  ["Portal do cliente", "Link direto, sem criar conta, com prazo e lembretes", "Também sem conta, com lembretes"],
  ["Exportação para Webflow", "CSV no formato de importação do Webflow, por página", "Exportações genéricas; Webflow por integração"],
  ["Exportação para Framer", "JSON pronto a colar no Framer", "Não é o foco do produto"],
  ["ZIP organizado", "Ficheiros agrupados por página e campo", "Download de ficheiros por pedido"],
  ["Aprovação campo a campo", "Aprovar ou pedir ajuste com nota, campo a campo", "Aprovação por secção/campo"],
  ["Idioma", "Interface em português europeu", "Interface em inglês"],
  ["Dimensão da equipa", "Produto novo, focado em agências web pequenas", "Produto estabelecido, mais funcionalidades gerais"],
];

function Comparar() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Comparações</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Lockcopy vs Content Snare</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        O Content Snare é uma referência em recolha de conteúdos de clientes. A Lockcopy nasceu mais pequena e focada:
        agências e freelancers que constroem sites em Webflow ou Framer e querem os conteúdos a chegar já no formato de importação.
      </p>

      <Card className="mt-10 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-4 font-medium text-muted-foreground"></th>
              <th className="p-4 font-semibold">Lockcopy</th>
              <th className="p-4 font-semibold">Content Snare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, a, b]) => (
              <tr key={k} className="border-b border-border last:border-0">
                <td className="p-4 font-medium">{k}</td>
                <td className="p-4 text-muted-foreground">{a}</td>
                <td className="p-4 text-muted-foreground">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-xl font-semibold text-foreground">Quando escolher a Lockcopy</h2>
        <p>
          Se o seu fluxo termina no Webflow ou no Framer, a Lockcopy poupa o passo de reformatar: o CSV sai no formato de
          importação do Webflow e o JSON pronto para o Framer, com os ficheiros organizados por página num ZIP.
        </p>
        <h2 className="font-display text-xl font-semibold text-foreground">Quando o Content Snare pode fazer mais sentido</h2>
        <p>
          Se precisa de um produto mais maduro, com mais integrações genéricas, mais idiomas de cliente e uma equipa de
          suporte maior, o Content Snare é uma escolha sólida e com provas dadas.
        </p>
        <p className="text-xs">Comparação baseada em informação pública disponível em novembro de 2026; confirme preços e funcionalidades atuais nos respetivos sites.</p>
      </section>

      <div className="mt-12 rounded-2xl bg-primary px-8 py-10 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold">Experimente sem compromisso</h2>
        <p className="mt-2 text-sm opacity-80">14 dias de teste. Nada é cobrado durante o teste.</p>
        <Link to="/comecar" className="mt-5 inline-block rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90">
          Começar o teste
        </Link>
      </div>
    </div>
  );
}
