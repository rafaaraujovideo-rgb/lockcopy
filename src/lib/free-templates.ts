/**
 * Modelos gratuitos de checklist de conteúdos, para download direto (CSV).
 * São os mesmos formatos que a exportação Webflow usa: página, campo, tipo, obrigatório, limite.
 */

export type FreeTemplate = {
  slug: string;
  name: string;
  description: string;
  rows: [page: string, label: string, type: string, required: boolean, charLimit: number | ""][];
};

export const FREE_TEMPLATES: FreeTemplate[] = [
  {
    slug: "site-institucional",
    name: "Site institucional (5 páginas)",
    description: "Início, Sobre, Serviços, Portfólio e Contactos — os textos e imagens essenciais de cada página.",
    rows: [
      ["Início", "Título principal (hero)", "texto", true, 90],
      ["Início", "Subtítulo de apoio", "texto", true, 160],
      ["Início", "Imagem principal", "imagem", true, ""],
      ["Início", "Três benefícios curtos", "texto longo", true, 400],
      ["Sobre", "História da empresa", "texto longo", true, 1200],
      ["Sobre", "Fotografias da equipa", "imagem", false, ""],
      ["Serviços", "Lista de serviços com descrição", "texto longo", true, 2000],
      ["Serviços", "Tabela de preços (se existir)", "texto longo", false, 800],
      ["Portfólio", "Projetos com legenda", "texto longo", true, 1500],
      ["Portfólio", "Imagens dos projetos", "imagem", true, ""],
      ["Contactos", "Morada, email e telefone", "texto", true, 200],
      ["Contactos", "Horário de atendimento", "texto", false, 120],
    ],
  },
  {
    slug: "loja-online",
    name: "Loja online",
    description: "Categorias, produtos, políticas e páginas de apoio para uma loja pronta a receber catálogo.",
    rows: [
      ["Início", "Título e proposta de valor", "texto", true, 140],
      ["Início", "Banner promocional", "imagem", false, ""],
      ["Catálogo", "Lista de categorias", "texto longo", true, 600],
      ["Produto", "Nome, descrição e preço por produto", "texto longo", true, 4000],
      ["Produto", "Fotografias dos produtos", "imagem", true, ""],
      ["Políticas", "Envios e prazos de entrega", "texto longo", true, 800],
      ["Políticas", "Trocas e devoluções", "texto longo", true, 800],
      ["Políticas", "Métodos de pagamento aceites", "texto", true, 200],
      ["Apoio", "Perguntas frequentes", "texto longo", false, 2000],
      ["Contactos", "Email e telefone de apoio", "texto", true, 200],
    ],
  },
  {
    slug: "landing-page",
    name: "Landing page de campanha",
    description: "Uma página única focada em conversão: hero, prova social, oferta e chamada para ação.",
    rows: [
      ["Hero", "Título da campanha", "texto", true, 80],
      ["Hero", "Subtítulo com a oferta", "texto", true, 160],
      ["Hero", "Imagem ou vídeo principal", "imagem", true, ""],
      ["Prova social", "Três testemunhos com nome e cargo", "texto longo", true, 900],
      ["Prova social", "Logótipos de clientes", "imagem", false, ""],
      ["Oferta", "O que está incluído", "texto longo", true, 800],
      ["Oferta", "Preço e condições", "texto", true, 200],
      ["FAQ", "Cinco perguntas frequentes", "texto longo", false, 1200],
      ["CTA final", "Texto do botão e garantia", "texto", true, 120],
    ],
  },
];

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function templateCsv(t: FreeTemplate): string {
  const header = "pagina;campo;tipo;obrigatorio;limite_caracteres";
  const lines = t.rows.map((r) => r.map((c) => csvEscape(c === "" ? "" : c)).join(";"));
  return [header, ...lines].join("\n");
}

export function downloadTemplate(t: FreeTemplate) {
  const blob = new Blob(["﻿" + templateCsv(t)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lockcopy-modelo-${t.slug}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
