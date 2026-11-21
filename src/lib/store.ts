import { useSyncExternalStore } from "react";

export type FieldType = "text" | "longtext" | "files";
export type Field = { id: string; label: string; type: FieldType; hint?: string };
export type Section = { id: string; page: string; fields: Field[] };
export type Template = { id: string; name: string; description: string; sections: Section[] };

export type FileItem = { name: string; size: number; type: string; webp: "ok" | "original" | "pending" };
export type Answer = {
  text: string;
  files: FileItem[];
  status: "vazio" | "enviado" | "aprovado" | "ajuste";
  note?: string;
};
export type HistoryEntry = { at: string; who: string; what: string };
export type Request = {
  id: string;
  token: string;
  client: string;
  clientEmail: string;
  title: string;
  templateId: string;
  sections: Section[];
  deadline: string;
  expiresAt: string;
  revoked: boolean;
  answers: Record<string, Answer>;
  history: HistoryEntry[];
};

export type Plan = "teste" | "solo" | "agency";
export const PLANS: Record<Plan, { name: string; month: number; year: number; requests: number; users: number; storageGb: number }> = {
  teste: { name: "Teste", month: 0, year: 0, requests: 1, users: 1, storageGb: 0.5 },
  solo: { name: "Solo", month: 19, year: 190, requests: 15, users: 1, storageGb: 5 },
  agency: { name: "Agency", month: 39, year: 390, requests: 50, users: 3, storageGb: 20 },
};

const f = (id: string, label: string, type: FieldType, hint?: string): Field => ({ id, label, type, hint });

export const TEMPLATES: Template[] = [
  {
    id: "institucional",
    name: "Site institucional",
    description: "Início, sobre, serviços e contactos.",
    sections: [
      { id: "home", page: "Início", fields: [f("home-title", "Frase principal", "text", "Uma linha sobre o que fazem."), f("home-hero", "Fotografia de capa", "files")] },
      { id: "about", page: "Sobre", fields: [f("about-story", "A vossa história", "longtext"), f("about-team", "Fotos da equipa", "files")] },
      { id: "services", page: "Serviços", fields: [f("services-list", "Lista de serviços", "longtext", "Um serviço por linha.")] },
      { id: "contact", page: "Contactos", fields: [f("contact-info", "Morada, telefone e email", "longtext"), f("contact-logo", "Logótipo", "files", "SVG ou PNG.")] },
    ],
  },
  {
    id: "landing",
    name: "Landing page",
    description: "Uma página de campanha com oferta e prova.",
    sections: [
      { id: "offer", page: "Oferta", fields: [f("offer-head", "Título", "text"), f("offer-body", "Descrição da oferta", "longtext")] },
      { id: "proof", page: "Prova", fields: [f("proof-quotes", "Testemunhos", "longtext"), f("proof-logos", "Logótipos de clientes", "files")] },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Catálogo, fotos de produto e políticas.",
    sections: [
      { id: "catalog", page: "Catálogo", fields: [f("catalog-products", "Produtos (nome, preço, descrição)", "longtext"), f("catalog-photos", "Fotos de produto", "files")] },
      { id: "policies", page: "Políticas", fields: [f("pol-shipping", "Envios e devoluções", "longtext")] },
    ],
  },
  {
    id: "rebranding",
    name: "Rebranding / assets",
    description: "Logótipos, cores, letras e imagens da marca.",
    sections: [
      { id: "brand", page: "Marca", fields: [f("brand-logos", "Logótipos atuais", "files"), f("brand-colors", "Cores e letras", "text"), f("brand-refs", "Referências que gostam", "files")] },
    ],
  },
];

const emptyAnswers = (sections: Section[]) =>
  Object.fromEntries(sections.flatMap((s) => s.fields.map((fl) => [fl.id, { text: "", files: [], status: "vazio" } as Answer])));

const now = () => new Date().toISOString();
const days = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const rid = () => Math.random().toString(36).slice(2, 10);

function seed(): Request {
  const t = TEMPLATES[0]!;
  const answers = emptyAnswers(t.sections);
  answers["home-title"] = { text: "Clínica dentária no centro do Porto desde 1998.", files: [], status: "enviado" };
  answers["home-hero"] = { text: "", files: [{ name: "fachada.heic", size: 3_400_000, type: "image/heic", webp: "pending" }, { name: "recepcao.jpg", size: 2_100_000, type: "image/jpeg", webp: "ok" }], status: "enviado" };
  answers["about-story"] = { text: "Fundada pelo Dr. Sousa...", files: [], status: "ajuste", note: "Podem acrescentar 2-3 frases sobre a equipa atual?" };
  return {
    id: "p1", token: "demo-x7k2q9", client: "Clínica Sousa", clientEmail: "geral@clinicasousa.pt",
    title: "Novo site institucional", templateId: t.id, sections: t.sections,
    deadline: days(10), expiresAt: days(30), revoked: false, answers,
    history: [
      { at: now(), who: "Agência", what: "Pedido criado a partir do modelo Site institucional" },
      { at: now(), who: "Cliente", what: "Enviou 'Frase principal' e 2 ficheiros em 'Fotografia de capa'" },
      { at: now(), who: "Agência", what: "Pediu ajuste em 'A vossa história'" },
    ],
  };
}

type State = { plan: Plan; chosen: Exclude<Plan, "teste">; billing: "month" | "year"; trialEnds: string | null; cardAdded: boolean; requests: Request[] };
let state: State = { plan: "teste", chosen: "solo", billing: "month", trialEnds: null, cardAdded: false, requests: [seed()] };
const subs = new Set<() => void>();
const set = (fn: (s: State) => State) => { state = fn(state); subs.forEach((l) => l()); };

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => (subs.add(l), () => subs.delete(l)), () => sel(state), () => sel(state));
}

export function activeLimit() { return PLANS[state.plan].requests; }

export const actions = {
  startTrial(plan: Exclude<Plan, "teste">, billing: "month" | "year") {
    set((s) => ({ ...s, cardAdded: true, plan: "teste", billing, trialEnds: days(14), chosen: plan }));
  },
  createRequest(input: { client: string; clientEmail: string; title: string; templateId: string; deadline: string }): Request | { error: string } {
    if (state.requests.filter((r) => !r.revoked).length >= activeLimit())
      return { error: `Atingiu o limite de ${activeLimit()} pedidos ativos do plano ${PLANS[state.plan].name}.` };
    const t = TEMPLATES.find((x) => x.id === input.templateId)!;
    const r: Request = {
      ...input, id: rid(), token: rid() + rid(), sections: t.sections, expiresAt: days(45), revoked: false,
      answers: emptyAnswers(t.sections), history: [{ at: now(), who: "Agência", what: `Pedido criado a partir do modelo ${t.name}` }],
    };
    set((s) => ({ ...s, requests: [r, ...s.requests] }));
    return r;
  },
  saveAnswer(token: string, fieldId: string, patch: Partial<Answer>, log?: string) {
    set((s) => ({
      ...s,
      requests: s.requests.map((r) => r.token !== token ? r : {
        ...r,
        answers: { ...r.answers, [fieldId]: { ...r.answers[fieldId]!, ...patch } },
        history: log ? [...r.history, { at: now(), who: "Cliente", what: log }] : r.history,
      }),
    }));
  },
  review(id: string, fieldId: string, status: "aprovado" | "ajuste", label: string, note?: string) {
    set((s) => ({
      ...s,
      requests: s.requests.map((r) => r.id !== id ? r : {
        ...r,
        answers: { ...r.answers, [fieldId]: { ...r.answers[fieldId]!, status, note } },
        history: [...r.history, { at: now(), who: "Agência", what: status === "aprovado" ? `Aprovou '${label}'` : `Pediu ajuste em '${label}'${note ? `: ${note}` : ""}` }],
      }),
    }));
  },
  revoke(id: string) {
    set((s) => ({ ...s, requests: s.requests.map((r) => r.id !== id ? r : { ...r, revoked: true, history: [...r.history, { at: now(), who: "Agência", what: "Link revogado" }] }) }));
  },
};

export function progress(r: Request) {
  const all = Object.values(r.answers);
  const done = all.filter((a) => a.status === "enviado" || a.status === "aprovado").length;
  return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
}

export function linkState(r: Request): "ativo" | "revogado" | "expirado" {
  if (r.revoked) return "revogado";
  if (r.expiresAt < new Date().toISOString().slice(0, 10)) return "expirado";
  return "ativo";
}

/* Exportações preparadas (não sincronização) */
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export function webflowCsv(r: Request) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["Name", "Slug", "Page", "Field", "Content", "Files"]];
  r.sections.forEach((s) => s.fields.forEach((fl) => {
    const a = r.answers[fl.id]!;
    rows.push([fl.label, slug(`${s.page}-${fl.label}`), s.page, fl.id, a.text, a.files.map((x) => x.name).join("; ")]);
  }));
  return rows.map((row) => row.map(esc).join(",")).join("\n");
}
export function framerJson(r: Request) {
  return JSON.stringify({
    project: r.title, client: r.client,
    pages: r.sections.map((s) => ({
      page: s.page, slug: slug(s.page),
      fields: Object.fromEntries(s.fields.map((fl) => [fl.id, { label: fl.label, text: r.answers[fl.id]!.text, files: r.answers[fl.id]!.files.map((x) => x.name) }])),
    })),
  }, null, 2);
}
export function zipManifest(r: Request) {
  return r.sections.flatMap((s) => s.fields.flatMap((fl) => r.answers[fl.id]!.files.flatMap((x) => {
    const base = `${slug(s.page)}/${slug(fl.label)}`;
    return x.webp === "ok" ? [`${base}/original/${x.name}`, `${base}/webp/${x.name.replace(/\.\w+$/, ".webp")}`] : [`${base}/original/${x.name}`];
  })));
}

export const UPLOAD = { maxBytes: 50 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/svg+xml", "application/pdf", "image/gif"] };
export const WEBP_OK = ["image/jpeg", "image/png", "image/webp"];
