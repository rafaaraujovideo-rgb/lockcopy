import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/lib/supabase-types";

const ORG_SELECT =
  "id, name, slug, logo_url, brand_color, plan, subscription_status, trial_ends_at, current_period_ends_at, grace_period_ends_at, storage_used_bytes, created_at";

const uuid = z.string().uuid();
const email = z.string().trim().email().max(200);
const text = (max: number) => z.string().trim().max(max);

/** Org + plan + limits of the signed-in user. */
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

/** Agency requests, newest first. */
export const listRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("requests")
      .select("id, org_id, title, client_name, client_email, status, token, due_date, expires_at, revoked_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    // Progresso por pedido: campos respondidos / total de campos.
    const ids = (data ?? []).map((r) => r.id);
    const total = new Map<string, number>();
    const done = new Map<string, number>();
    if (ids.length) {
      const { data: secs } = await context.supabase.from("sections").select("id, request_id").in("request_id", ids);
      const secToReq = new Map((secs ?? []).map((s) => [s.id, s.request_id]));
      if (secToReq.size) {
        const { data: flds } = await context.supabase.from("fields").select("id, section_id").in("section_id", [...secToReq.keys()]);
        for (const f of flds ?? []) {
          const rid = secToReq.get(f.section_id);
          if (rid) total.set(rid, (total.get(rid) ?? 0) + 1);
        }
      }
      const { data: subs } = await context.supabase.from("submissions").select("request_id, status").in("request_id", ids);
      for (const s of subs ?? []) {
        if (s.status === "submitted" || s.status === "approved") done.set(s.request_id, (done.get(s.request_id) ?? 0) + 1);
      }
    }

    return (data ?? []).map((r) => ({ ...r, fieldsTotal: total.get(r.id) ?? 0, fieldsDone: done.get(r.id) ?? 0 })) as Array<
      { fieldsTotal: number; fieldsDone: number } & Pick<
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

/** Full request: sections, fields, answers, files and history. */
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
    if (!request) throw new Error("Request not found or no access.");

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

/** Creates a request from a template and returns the client link. */
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
        skip: z.array(z.object({ section: text(200), label: text(200) })).max(200).optional(),
        extra: z.array(z.object({ label: text(200).min(1), type: z.enum(["text", "textarea", "image", "file"]), help: text(300).optional(), limit: z.number().int().min(1).max(20000).optional() })).max(30).optional(),
        rename: z.array(z.object({ section: text(200), label: text(200), to: text(200).min(1) })).max(200).optional(),
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
      if (!membership) throw new Error("No organization linked to this account.");
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
    const created = result as { id: string; token: string; url: string };
    if (data.skip?.length || data.extra?.length || data.rename?.length) {
      await customizeFields(supabase, created.id, data.skip ?? [], data.extra ?? [], data.rename ?? []);
    }
    return created;
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

/** Archives a request (frees a plan slot) or brings it back. */
export const setArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ requestId: uuid, archived: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("requests")
      .update({ status: data.archived ? "archived" : "in_progress" })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Switches the request's public link on or off. */
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
// Client portal: public, validated by the link token
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

/** Opens the portal by token. No session: the anon role only passes these RPCs. */
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

/** Client leaves a question or note on a field (empty clears it). */
export const portalSetNote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: uuid, fieldId: uuid, note: z.string().max(2000) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = (await portalClient()) as unknown as { rpc: (f: string, a: unknown) => Promise<{ data: unknown; error: { message: string } | null }> };
    const { error } = await supabase.rpc("portal_set_note", { _token: data.token, _field: data.fieldId, _note: data.note });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Client notes for every field of this link, keyed by field id. Empty if the notes feature isn't installed yet. */
export const portalNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: uuid }).parse(data))
  .handler(async ({ data }) => {
    const supabase = (await portalClient()) as unknown as { rpc: (f: string, a: unknown) => Promise<{ data: unknown; error: { message: string } | null }> };
    const { data: result, error } = await supabase.rpc("portal_notes", { _token: data.token });
    if (error) return {} as Record<string, string>;
    return (result ?? {}) as Record<string, string>;
  });

/** Client hands the content over: logs it and emails the agency team. */
export const portalSendToAgency = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: uuid }).parse(data))
  .handler(async ({ data }) => {
    const supabase = (await portalClient()) as unknown as { rpc: (f: string, a: unknown) => Promise<{ data: unknown; error: { message: string } | null }> };
    const { data: result, error } = await supabase.rpc("portal_send_to_agency", { _token: data.token });
    if (error) throw new Error(error.message);
    // Email the agency now instead of waiting for the daily run.
    try {
      const { createAdminSupabase } = await import("@/integrations/supabase/client.server");
      const { flushNotifications } = await import("@/lib/notify-flush.server");
      await flushNotifications(createAdminSupabase(), 10, data.token);
    } catch (e) {
      console.error("instant agency email failed", e);
    }
    return result as { ready: number; total: number };
  });

/** Client removes a file it sent by mistake (blocked once the field is approved). */
export const portalRemoveFile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: uuid, fileId: uuid }).parse(data))
  .handler(async ({ data }) => {
    const supabase = (await portalClient()) as unknown as { rpc: (f: string, a: unknown) => Promise<{ data: unknown; error: { message: string } | null }> };
    const { data: result, error } = await supabase.rpc("portal_remove_file", { _token: data.token, _file: data.fileId });
    if (error) throw new Error(error.message);
    return result as { paths: Array<string | null> };
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
 * Registers a file already uploaded to the bucket. The RPC validates the path:
 * it must be <org>/<token>/<field>/<name>.
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

/**
 * Attaches the WebP version (made in the browser) to the registered original.
 * The original is always kept; the WebP is for light previews.
 */
export const portalAttachWebp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: uuid,
        fileId: uuid,
        webpPath: text(600).min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = await portalClient();
    const { error } = await supabase.rpc("portal_attach_webp", {
      _token: data.token,
      _file: data.fileId,
      _webp_path: data.webpPath,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Removes skipped template fields and appends the agency's own questions to a new request. */
async function customizeFields(
  supabase: { from: (t: string) => any },
  requestId: string,
  skip: Array<{ section: string; label: string }>,
  extra: Array<{ label: string; type: "text" | "textarea" | "image" | "file"; help?: string | undefined; limit?: number | undefined }>,
  rename: Array<{ section: string; label: string; to: string }> = [],
) {
  const { data: secs, error } = await supabase.from("sections").select("id, title, order_index, fields(id, label)").eq("request_id", requestId);
  if (error) throw new Error(error.message);
  const rows = (secs ?? []) as Array<{ id: string; title: string; order_index: number; fields: Array<{ id: string; label: string }> }>;
  const key = (a: string, b: string) => `${a}\u0000${b}`;
  const drop = new Set(skip.map((x) => key(x.section, x.label)));
  const ids = rows.flatMap((sec) => sec.fields.filter((f) => drop.has(key(sec.title, f.label))).map((f) => f.id));
  if (ids.length) {
    const del = await supabase.from("fields").delete().in("id", ids);
    if (del.error) throw new Error(del.error.message);
  }
  for (const rn of rename) {
    const sec = rows.find((x) => x.title === rn.section);
    const f = sec?.fields.find((x) => x.label === rn.label);
    if (!f || ids.includes(f.id)) continue;
    const up = await supabase.from("fields").update({ label: rn.to }).eq("id", f.id);
    if (up.error) throw new Error(up.error.message);
  }
  const empty = rows.filter((sec) => sec.fields.length > 0 && sec.fields.every((f) => ids.includes(f.id))).map((sec) => sec.id);
  if (empty.length) await supabase.from("sections").delete().in("id", empty);
  if (extra.length) {
    const next = rows.reduce((m, r) => Math.max(m, r.order_index), 0) + 1;
    const ins = await supabase.from("sections").insert({ request_id: requestId, title: "Extra questions", order_index: next }).select("id").single();
    if (ins.error) throw new Error(ins.error.message);
    const f = await supabase.from("fields").insert(extra.map((x, i) => ({ section_id: ins.data.id, label: x.label, help_text: x.help || null, field_type: x.type, is_required: false, char_limit: x.limit ?? null, order_index: i })));
    if (f.error) throw new Error(f.error.message);
  }
}

const templateField = z.object({ label: text(200).min(1), help: text(300).optional(), type: z.enum(["text", "textarea", "image", "file"]), limit: z.number().int().min(1).max(20000).optional() });

/** Saves the current set of questions as the agency's own reusable template. */
export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      orgId: uuid,
      name: text(80).min(1),
      sections: z.array(z.object({ title: text(200).min(1), fields: z.array(templateField).min(1).max(100) })).min(1).max(30),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("save_org_template" as never, { _org: data.orgId, _name: data.name, _sections: data.sections } as never);
    if (error) throw new Error(error.message);
    return { id: id as unknown as string };
  });

/** Removes one of the agency's saved templates (requests already created keep their questions). */
export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ templateId: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("delete_org_template" as never, { _template: data.templateId } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
