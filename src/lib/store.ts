import { useSyncExternalStore } from "react";

export type FieldType = "text" | "longtext" | "files";
export type Field = { id: string; label: string; type: FieldType; hint?: string | undefined };
export type Section = { id: string; page: string; fields: Field[] };
export type Template = { id: string; name: string; description: string; sections: Section[] };

export type FileItem = { name: string; size: number; type: string; webp: "ok" | "original" | "pending" };
export type Answer = {
  text: string;
  files: FileItem[];
  status: "vazio" | "enviado" | "aprovado" | "ajuste";
  note?: string | undefined;
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
  teste: { name: "Trial", month: 0, year: 0, requests: 1, users: 1, storageGb: 0.5 },
  solo: { name: "Solo", month: 19, year: 190, requests: 15, users: 1, storageGb: 5 },
  agency: { name: "Agency", month: 39, year: 390, requests: 50, users: 3, storageGb: 20 },
};

const f = (id: string, label: string, type: FieldType, hint?: string): Field => ({ id, label, type, hint });

export const TEMPLATES: Template[] = [
  {
    id: "institucional",
    name: "Business website",
    description: "Home, about, services and contact.",
    sections: [
      { id: "home", page: "Home", fields: [f("home-title", "Main headline", "text", "One line about what you do."), f("home-hero", "Cover photo", "files")] },
      { id: "about", page: "About", fields: [f("about-story", "Your story", "longtext"), f("about-team", "Team photos", "files")] },
      { id: "services", page: "Services", fields: [f("services-list", "List of services", "longtext", "One service per line.")] },
      { id: "contact", page: "Contact", fields: [f("contact-info", "Address, phone and email", "longtext"), f("contact-logo", "Logo", "files", "SVG or PNG.")] },
    ],
  },
  {
    id: "landing",
    name: "Landing page",
    description: "A campaign page with offer and proof.",
    sections: [
      { id: "offer", page: "Offer", fields: [f("offer-head", "Headline", "text"), f("offer-body", "Offer description", "longtext")] },
      { id: "proof", page: "Proof", fields: [f("proof-quotes", "Testimonials", "longtext"), f("proof-logos", "Client logos", "files")] },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Catalogue, product photos and policies.",
    sections: [
      { id: "catalog", page: "Catalogue", fields: [f("catalog-products", "Products (name, price, description)", "longtext"), f("catalog-photos", "Product photos", "files")] },
      { id: "policies", page: "Policies", fields: [f("pol-shipping", "Shipping and returns", "longtext")] },
    ],
  },
  {
    id: "rebranding",
    name: "Rebranding / assets",
    description: "Logos, colours, fonts and brand imagery.",
    sections: [
      { id: "brand", page: "Brand", fields: [f("brand-logos", "Current logos", "files"), f("brand-colors", "Colours and fonts", "text"), f("brand-refs", "References you like", "files")] },
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
  answers["home-title"] = { text: "A family dental clinic in the city centre since 1998.", files: [], status: "enviado" };
  answers["home-hero"] = { text: "", files: [{ name: "facade.heic", size: 3_400_000, type: "image/heic", webp: "pending" }, { name: "reception.jpg", size: 2_100_000, type: "image/jpeg", webp: "ok" }], status: "enviado" };
  answers["about-story"] = { text: "Founded by Dr. Reed...", files: [], status: "ajuste", note: "Could you add 2-3 sentences about the current team?" };
  return {
    id: "p1", token: "demo-x7k2q9", client: "Reed Clinic", clientEmail: "hello@reedclinic.com",
    title: "New business website", templateId: t.id, sections: t.sections,
    deadline: days(10), expiresAt: days(30), revoked: false, answers,
    history: [
      { at: now(), who: "Agency", what: "Request created from the Business website template" },
      { at: now(), who: "Client", what: "Sent 'Main headline' and 2 files in 'Cover photo'" },
      { at: now(), who: "Agency", what: "Requested a change in 'Your story'" },
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
      return { error: `You reached the limit of ${activeLimit()} active requests on the ${PLANS[state.plan].name} plan.` };
    const t = TEMPLATES.find((x) => x.id === input.templateId)!;
    const r: Request = {
      ...input, id: rid(), token: rid() + rid(), sections: t.sections, expiresAt: days(45), revoked: false,
      answers: emptyAnswers(t.sections), history: [{ at: now(), who: "Agency", what: `Request created from the ${t.name} template` }],
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
        history: log ? [...r.history, { at: now(), who: "Client", what: log }] : r.history,
      }),
    }));
  },
  review(id: string, fieldId: string, status: "aprovado" | "ajuste", label: string, note?: string) {
    set((s) => ({
      ...s,
      requests: s.requests.map((r) => r.id !== id ? r : {
        ...r,
        answers: { ...r.answers, [fieldId]: { ...r.answers[fieldId]!, status, note } },
        history: [...r.history, { at: now(), who: "Agency", what: status === "aprovado" ? `Approved '${label}'` : `Requested a change in '${label}'${note ? `: ${note}` : ""}` }],
      }),
    }));
  },
  revoke(id: string) {
    set((s) => ({ ...s, requests: s.requests.map((r) => r.id !== id ? r : { ...r, revoked: true, history: [...r.history, { at: now(), who: "Agency", what: "Link revoked" }] }) }));
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

/* Prepared exports (not a sync) */
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
