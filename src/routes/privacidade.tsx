import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — Lockcopy" },
      { name: "description", content: "Como a Lockcopy recolhe, usa e protege os dados das agências e dos clientes delas." },
      { property: "og:title", content: "Política de privacidade — Lockcopy" },
      { property: "og:description", content: "Como a Lockcopy recolhe, usa e protege os dados das agências e dos clientes delas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

const sections: [string, string[]][] = [
  [
    "Quem é responsável pelos dados",
    [
      "A Lockcopy é a responsável pelo tratamento dos dados da conta da agência (nome, email, dados de faturação).",
      "Pelos conteúdos que os clientes enviam através dos portais, a agência é a responsável pelo tratamento e a Lockcopy atua como subcontratante, nos termos do acordo de tratamento de dados (DPA).",
    ],
  ],
  [
    "Que dados recolhemos",
    [
      "Conta: nome da agência, email e palavra-passe (guardada apenas como hash pelo fornecedor de autenticação).",
      "Faturação: tratada pelo Stripe; a Lockcopy nunca vê nem guarda números de cartão.",
      "Conteúdos dos pedidos: textos e ficheiros que os clientes enviam, mais o email do cliente para lembretes.",
      "Dados técnicos: registos de acesso e erros, usados apenas para operar e proteger o serviço.",
    ],
  ],
  [
    "Para que usamos os dados",
    [
      "Prestar o serviço: criar pedidos, mostrar portais, guardar respostas e ficheiros, exportar conteúdos.",
      "Enviar emails operacionais: confirmação de conta, lembretes de entrega e avisos de aprovação.",
      "Cobrar a subscrição e cumprir obrigações fiscais.",
      "Não vendemos dados, não mostramos publicidade e não usamos conteúdos dos clientes para treinar modelos.",
    ],
  ],
  [
    "Onde ficam os dados e por quanto tempo",
    [
      "Os dados ficam numa base de dados PostgreSQL (Supabase) e os ficheiros num armazenamento privado com acesso por ligações assinadas de curta duração.",
      "Os portais dos clientes têm prazo de validade e podem ser desligados pela agência a qualquer momento.",
      "Quando um pedido é arquivado ou a conta é encerrada, os conteúdos são eliminados num prazo máximo de 90 dias, salvo obrigação legal em contrário.",
    ],
  ],
  [
    "Direitos das pessoas",
    [
      "Qualquer pessoa pode pedir acesso, retificação, apagamento, portabilidade ou oposição ao tratamento dos seus dados.",
      "Para conteúdos enviados a uma agência, o pedido deve ser feito à agência; a Lockcopy ajuda a agência a cumpri-lo.",
      "Para dados da conta Lockcopy, escreva para privacidade@lockcopy.com.",
      "Tem ainda o direito de reclamar junto da CNPD (Comissão Nacional de Proteção de Dados).",
    ],
  ],
  [
    "Segurança",
    [
      "Ligações cifradas (TLS), regras de acesso por linha na base de dados (RLS), tokens de portal aleatórios e revogáveis, e armazenamento privado para ficheiros.",
      "O acesso administrativo é limitado ao estritamente necessário para operar o serviço.",
    ],
  ],
];

function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Documento legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Política de privacidade</h1>
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
        Ver também: <Link to="/termos" className="underline hover:text-foreground">Termos de serviço</Link> · <Link to="/dpa" className="underline hover:text-foreground">Acordo de tratamento de dados</Link>
      </p>
    </div>
  );
}
