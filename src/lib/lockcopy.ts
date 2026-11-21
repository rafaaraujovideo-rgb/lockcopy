/** Regras de apresentação partilhadas pelo painel e pelo portal. */

export type SubmissionStatus = "pending" | "submitted" | "approved" | "rejected";

/** Estado da resposta → etiqueta mostrada ao utilizador. */
export function answerLabel(status: SubmissionStatus | null | undefined): "vazio" | "enviado" | "aprovado" | "ajuste" {
  switch (status) {
    case "submitted":
      return "enviado";
    case "approved":
      return "aprovado";
    case "rejected":
      return "ajuste";
    default:
      return "vazio";
  }
}

export function requestLinkState(r: { revoked_at: string | null; expires_at: string; status?: string }, now = new Date()): "ativo" | "revogado" | "expirado" {
  if (r.revoked_at || r.status === "archived") return "revogado";
  if (new Date(r.expires_at).getTime() <= now.getTime()) return "expirado";
  return "ativo";
}

export const isFileField = (type: string) => type === "image" || type === "file";

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }) : "sem prazo";

export const fmtMb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Slug válido para a organização: 3–40 caracteres, minúsculas, números e hífenes. */
export function orgSlug(name: string, suffix: string) {
  const base = slugify(name).slice(0, 30).replace(/-+$/, "") || "agencia";
  return `${base.length < 2 ? base + "x" : base}-${suffix}`.slice(0, 40);
}

/** Erros das funções da base de dados vêm como "codigo — mensagem"; mostra só a mensagem. */
export function friendlyError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  const parts = msg.split(" — ");
  return parts.length > 1 ? parts.slice(1).join(" — ") : msg;
}

const EVENT_TEXT: Record<string, string> = {
  request_created: "Pedido criado",
  text_saved: "Cliente atualizou um texto",
  file_added: "Cliente carregou um ficheiro",
  field_approved: "Agência aprovou um campo",
  field_adjust_requested: "Agência pediu um ajuste",
  link_revoked: "Link desligado",
  link_reopened: "Link reativado",
  reminder_sent: "Lembrete enviado",
};

export function eventText(kind: string, detail: unknown) {
  const d = (detail ?? {}) as Record<string, unknown>;
  const label = typeof d["label"] === "string" ? ` '${d["label"]}'` : "";
  const name = typeof d["name"] === "string" ? `: ${d["name"]}` : "";
  return (EVENT_TEXT[kind] ?? kind.replace(/_/g, " ")) + label + name;
}

export const ACCEPTED_UPLOADS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/svg+xml", "image/gif", "application/pdf"];
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Valida um ficheiro antes de enviar. Devolve a mensagem de erro ou null. */
export function uploadProblem(file: { name: string; size: number; type: string }, allowed?: string[] | null) {
  const type = file.type || (file.name.toLowerCase().endsWith(".heic") ? "image/heic" : "");
  const list = allowed && allowed.length ? allowed : ACCEPTED_UPLOADS;
  if (!list.includes(type)) return `${file.name}: tipo de ficheiro não aceite`;
  if (file.size <= 0) return `${file.name}: ficheiro vazio`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name}: maior que 50 MB`;
  return null;
}
