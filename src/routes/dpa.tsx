import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dpa")({
  head: () => ({
    meta: [
      { title: "Acordo de tratamento de dados (DPA) — Lockcopy" },
      { name: "description", content: "Como a Lockcopy trata, em nome da agência, os dados pessoais enviados pelos clientes dela." },
      { property: "og:title", content: "Acordo de tratamento de dados (DPA) — Lockcopy" },
      { property: "og:description", content: "Como a Lockcopy trata, em nome da agência, os dados pessoais enviados pelos clientes dela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dpa,
});

const sections: [string, string[]][] = [
  [
    "Papel de cada parte",
    [
      "A agência é a responsável pelo tratamento dos dados pessoais que recolhe através dos portais Lockcopy.",
      "A Lockcopy é subcontratante: trata esses dados apenas segundo as instruções da agência e para prestar o serviço.",
      "Este acordo aplica-se automaticamente a todas as contas ativas, nos termos do artigo 28.º do RGPD.",
    ],
  ],
  [
    "Objeto e duração",
    [
      "Tratamento: alojamento, organização, transmissão e eliminação de textos e ficheiros enviados pelos clientes da agência.",
      "Duração: enquanto a conta estiver ativa; no fim, os dados são eliminados nos prazos da política de privacidade.",
    ],
  ],
  [
    "Obrigações da Lockcopy",
    [
      "Tratar os dados só para prestar o serviço, nunca para fins próprios.",
      "Manter medidas técnicas adequadas: cifragem em trânsito, regras de acesso por linha, tokens de portal revogáveis e armazenamento privado.",
      "Garantir que as pessoas com acesso aos dados estão sujeitas a confidencialidade.",
      "Ajudar a agência a responder a pedidos de titulares (acesso, retificação, apagamento, portabilidade).",
      "Notificar a agência sem demora injustificada em caso de violação de dados pessoais.",
    ],
  ],
  [
    "Subcontratantes ulteriores",
    [
      "Supabase (base de dados e armazenamento), Stripe (pagamentos) e o fornecedor de envio de emails transacionais.",
      "A agência é informada de qualquer alteração relevante a esta lista e pode opor-se por motivo legítimo.",
    ],
  ],
  [
    "Transferências internacionais",
    [
      "Sempre que dados sejam transferidos para fora do EEE, é garantida uma salvaguarda adequada (cláusulas contratuais-tipo ou decisão de adequação).",
    ],
  ],
  [
    "Auditoria e eliminação",
    [
      "A Lockcopy disponibiliza as informações razoavelmente necessárias para demonstrar o cumprimento deste acordo.",
      "Finda a relação, os dados são eliminados ou devolvidos à agência, à escolha desta, salvo obrigação legal de conservação.",
    ],
  ],
];

function Dpa() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Documento legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Acordo de tratamento de dados</h1>
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
        Ver também: <Link to="/privacidade" className="underline hover:text-foreground">Política de privacidade</Link> · <Link to="/termos" className="underline hover:text-foreground">Termos de serviço</Link>
      </p>
    </div>
  );
}
