import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de serviço — Lockcopy" },
      { name: "description", content: "As regras de uso da Lockcopy: teste de 14 dias, cobrança, responsabilidades e cancelamento." },
      { property: "og:title", content: "Termos de serviço — Lockcopy" },
      { property: "og:description", content: "As regras de uso da Lockcopy: teste de 14 dias, cobrança, responsabilidades e cancelamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Termos,
});

const sections: [string, string[]][] = [
  [
    "O serviço",
    [
      "A Lockcopy é uma ferramenta para agências e freelancers recolherem textos e ficheiros dos seus clientes através de portais com prazo, reverem e aprovarem cada conteúdo e exportarem o resultado.",
      "Ao criar uma conta, a agência confirma que tem autorização para pedir e tratar os conteúdos dos seus clientes.",
    ],
  ],
  [
    "Teste e cobrança",
    [
      "O teste de 14 dias começa só depois de introduzir um meio de pagamento no Stripe. Nada é cobrado durante o teste.",
      "Se não cancelar antes do fim do teste, a subscrição escolhida (mensal ou anual) é cobrada automaticamente.",
      "Pode cancelar a qualquer momento no portal de faturação; o acesso mantém-se até ao fim do período já pago.",
      "Os preços apresentados não incluem impostos, que são acrescentados conforme a legislação aplicável.",
    ],
  ],
  [
    "Responsabilidades da agência",
    [
      "Manter a confidencialidade da sua conta e dos links dos portais.",
      "Não usar o serviço para recolher conteúdos ilegais, ofensivos ou sem direitos de uso.",
      "Garantir que tem base legal para tratar os dados pessoais que pede aos clientes.",
    ],
  ],
  [
    "Limites e disponibilidade",
    [
      "Cada plano tem limites de pedidos ativos, utilizadores e armazenamento, descritos na página de preços.",
      "Fazemos o possível por manter o serviço disponível, mas não garantimos disponibilidade ininterrupta; manutenções são avisadas com antecedência razoável.",
      "A Lockcopy não é responsável por perdas indiretas (lucros cessantes, perda de clientes) resultantes de falhas do serviço.",
    ],
  ],
  [
    "Conteúdo e propriedade",
    [
      "Os conteúdos enviados pelos clientes pertencem à agência e/ou ao cliente; a Lockcopy não adquire qualquer direito sobre eles.",
      "A marca, o código e o design da Lockcopy pertencem à Lockcopy.",
    ],
  ],
  [
    "Resolução e lei aplicável",
    [
      "Qualquer das partes pode terminar a conta; os dados são eliminados conforme a política de privacidade.",
      "Aplicam-se as leis de Portugal; litígios são submetidos aos tribunais portugueses, salvo norma imperativa em contrário.",
    ],
  ],
];

function Termos() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Documento legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Termos de serviço</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 21 de novembro de 2026</p>
      <div className="mt-10 space-y-10">
        {sections.map(([title, paras]) => (
          <section key={title}>
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {paras.map((p) => <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-muted-foreground">{p}</p>)}
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        Ver também: <Link to="/privacidade" className="underline hover:text-foreground">Política de privacidade</Link> · <Link to="/dpa" className="underline hover:text-foreground">Acordo de tratamento de dados</Link>
      </p>
    </div>
  );
}
