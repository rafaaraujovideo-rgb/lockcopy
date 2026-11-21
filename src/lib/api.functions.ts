import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/lib/supabase-types";

const ORG_SELECT =
  "id, name, slug, logo_url, brand_color, plan, subscription_status, trial_ends_at, current_period_ends_at, grace_period_ends_at, storage_used_bytes, created_at";

const uuid = z.string().uuid();
const email = z.string().trim().email().max(200);
const text = (max: number) => z.string().trim().max(max);

/** Org + plano + limites do utilizador autenticado. */
export const getWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw new Error(membershipError.message);
    if (!membership) return null;

    const { data: org } = await supabase
      .from("organizations")
      .select(ORG_SELECT)
      .eq("id", membership.org_id)
      .maybeSingle();

    const { data: limits } = await supabase
      .from("plan_limits")
      .select("*")
      .eq("plan", org?.plan ?? "teste")
      .maybeSingle();

    const { count: activeRequests } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .is("revoked_at", null)
      .neq("status", "archived");

    return {
      org: org ?? null,
      role: membership.role,
      limits: limits ?? null,
      activeRequests: activeRequests ?? 0,
    };
  });

/** Lista de pedidos da agência, mais recentes primeiro. */
export const listRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("requests")
      .select("id, org_id, title, client_name, client_email, status, token, due_date, expires_at, revoked_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return data as Array<
      Pick<
        Tables<"requests">,
        | "id"
        | "org_id"
        | "title"
        | "client_name"
        | "client_email"
        | "status"
        | "token"
        | "due_date"
        | "expires_at"
        | "revoked_at"
        | "created_at"
        | "updated_at"
      >
    >;
  });

type RequestDetail = {
  request: Tables<"requests">;
  sections: Array<Tables<"sections">>;
  fields: Array<Tables<"fields">>;
  submissions: Array<Tables<"submissions">>;
  files: Array<Tables<"submission_files">>;
  events: Array<Tables<"request_events">>;
};

/** Pedido completo: secções, campos, respostas, anexos e histórico. */
export const getRequestDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ requestId: uuid }).parse(data),
  )
  .handler(async ({ data, context }): Promise<RequestDetail> => {
    const { supabase } = context;

    const { data: request, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", data.requestId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!request) throw new Error("Pedido não encontrado ou sem acesso.");

    const [sections, fields, submissions, files, events] = await Promise.all([
      supabase
        .from("sections")
        .select("*")
        .eq("request_id", request.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("fields")
        .select("*")
        .in(
          "section_id",
          (await supabase
            .from("sections")
            .select("id")
            .eq("request_id", request.id)
          ).data?.map((s) => s.id) ?? [],
        )
        .order("order_index", { ascending: true }),
      supabase
        .from("submissions")
        .select("*")
        .eq("request_id", request.id),
      supabase
        .from("submission_files")
        .select("*")
        .eq("request_id", request.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("request_events")
        .select("*")
        .eq("request_id", request.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    return {
      request,
      sections: sections.data ?? [],
      fields: fields.data ?? [],
      submissions: submissions.data ?? [],
      files: files.data ?? [],
      events: events.data ?? [],
    };
  });

/** Cria um pedido a partir de um modelo e devolve o link do cliente. */
export const createRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orgId: uuid.optional(),
        templateId: uuid,
        title: text(200).min(1),
        clientName: text(160).min(1),
        clientEmail: email,
        clientPhone: text(40).optional().or(z.literal("")),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
        expiresAt: z.string().datetime().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let orgId = data.orgId;
    if (!orgId) {
      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!membership) throw new Error("Sem organização associada a esta conta.");
      orgId = membership.org_id;
    }

    const { data: result, error } = await supabase.rpc(
      "create_request_from_template",
      {
        _org: orgId,
        _template: data.templateId,
        _title: data.title,
        _client_name: data.clientName,
        _client_email: data.clientEmail,
        _client_phone: data.clientPhone || null,
        _due_date: data.dueDate || null,
        _expires_at: data.expiresAt ?? new Date(Date.now() + 45 * 864e5).toISOString(),
      },
    );

    if (error) throw new Error(error.message);
    return result as { id: string; token: string; url: string };
  });

/** Aprova ou devolve um campo ao cliente. */
export const reviewField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fieldId: uuid,
        decision: z.enum(["approve", "adjust"]),
        note: text(2000).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("review_field", {
      _field: data.fieldId,
      _decision: data.decision,
      _note: data.note || null,
    });

    if (error) throw new Error(error.message);
    return result as { status: string; note: string | null };
  });

/** Liga ou desliga o link público do pedido. */
export const setRequestLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ requestId: uuid, revoke: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("set_request_link", {
      _request: data.requestId,
      _revoke: data.revoke,
    });

    if (error) throw new Error(error.message);
    return result as { status: string; revoked_at: string | null };
  });

/** Mete um lembrete neutro na fila de emails. */
export const sendReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ requestId: uuid }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("send_reminder", {
      _request: data.requestId,
    });

    if (error) throw new Error(error.message);
    return result as { missing: number; queued: boolean };
  });

// ---------------------------------------------------------------------
// Portal do cliente: público, validado pelo token do link
// ---------------------------------------------------------------------

export type PortalFile = {
  id: string;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  image_status: string;
  storage_path: string;
  webp_storage_path: string | null;
};

export type PortalField = {
  id: string;
  label: string;
  help_text: string | null;
  field_type: string;
  is_required: boolean;
  char_limit: number | null;
  allowed_mime: string[] | null;
  order_index: number;
};

export type PortalSection = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  fields: PortalField[];
};

export type PortalSubmission = {
  field_id: string;
  value_text: string;
  status: string;
  rejection_note: string | null;
  version: number;
  updated_at: string;
  files: PortalFile[];
};

export type PortalPayload = {
  request: {
    id: string;
    title: string;
    client_name: string;
    client_email: string;
    status: string;
    due_date: string | null;
    expires_at: string;
    agency_name: string;
    logo_url: string | null;
    brand_color: string | null;
  };
  sections: PortalSection[];
  submissions: PortalSubmission[];
};

async function portalClient() {
  const { createServerSupabase } = await import("@/integrations/supabase/client.server");
  return createServerSupabase();
}

/** Abre o portal pelo token. Sem sessão: o papel anon só passa nestas RPCs. */
export const portalLoad = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: uuid }).parse(data))
  .handler(async ({ data }): Promise<PortalPayload> => {
    const supabase = await portalClient();
    const { data: result, error } = await supabase.rpc("portal_load", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    return result as unknown as PortalPayload;
  });

/** Guarda uma resposta com autosave. */
export const portalSave = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: uuid,
        fieldId: uuid,
        text: z.string().max(20000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await portalClient();
    const { data: result, error } = await supabase.rpc("portal_save", {
      _token: data.token,
      _field: data.fieldId,
      _text: data.text,
    });
    if (error) throw new Error(error.message);
    return result as { status: string; version: number };
  });

/**
 * Regista um ficheiro já enviado para o bucket. O caminho é validado pela RPC:
 * tem de ser <org>/<token>/<field>/<nome>.
 */
export const portalRegisterFile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: uuid,
        fieldId: uuid,
        path: text(600).min(1),
        name: text(260).min(1),
        mime: text(120).min(1),
        size: z.number().int().positive(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await portalClient();
    const { data: result, error } = await supabase.rpc("portal_register_file", {
      _token: data.token,
      _field: data.fieldId,
      _path: data.path,
      _name: data.name,
      _mime: data.mime,
      _size: data.size,
    });
    if (error) throw new Error(error.message);
    return result as { file_id: string; image_status: string };
  });
