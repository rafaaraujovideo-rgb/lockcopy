import { createFileRoute } from "@tanstack/react-router";

import { reminderEmail, reminderKind, reminderOffsetFor } from "@/lib/reminders";

/**
 * Email and reminder worker.
 *
 * Public route (no user session), but protected by a secret:
 * the caller (external cron, e.g. cron-job.org or Supabase scheduling)
 * must send `Authorization: Bearer <CRON_SECRET>`.
 *
 * Flow: claims pending notifications (claim_notifications), sends each
 * via Brevo and records the result (finish_notification). Without BREVO_API_KEY
 * notifications are marked failed with an explicit error, so they never
 * pretend to be sent.
 */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER = "notify@lockcopy.com";

type Notification = {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function parseFrom(from: string): { name?: string; email: string } {
  const m = /^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/.exec(from);
  if (m && m[2]) {
    const name = (m[1] ?? "").trim();
    return name ? { name, email: m[2].trim() } : { email: m[2].trim() };
  }
  const bare = /^\s*([^\s<>()]+@[^\s<>()]+\.[^\s<>()]+)\s*$/.exec(from);
  if (bare && bare[1]) return { email: bare[1].trim() };
  return { email: DEFAULT_SENDER };
}

async function sendEmail(from: string, apiKey: string, n: Notification): Promise<string | null> {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: parseFrom(from),
      to: [{ email: n.recipient }],
      subject: n.subject,
      textContent: n.body,
    }),
  });
  if (res.ok) return null;
  const detail = (await res.text()).slice(0, 300);
  return `Brevo ${res.status}: ${detail}`;
}

type Admin = ReturnType<typeof import("@/integrations/supabase/client.server").createAdminSupabase>;

/** Queues today's automatic deadline reminders once per request and step. */
async function scheduleReminders(supabase: Admin) {
  const today = new Date().toISOString().slice(0, 10);
  const appUrl = (process.env["APP_URL"] ?? "https://lockcopy.com").trim().replace(/\/$/, "");
  const { data: reqs } = await supabase
    .from("requests")
    .select("id, org_id, title, client_email, status, due_date, revoked_at, expires_at, token")
    .not("due_date", "is", null)
    .in("status", ["sent", "in_progress"])
    .is("revoked_at", null);
  for (const r of reqs ?? []) {
    const offset = reminderOffsetFor(r, today);
    if (offset === null) continue;
    const kind = reminderKind(offset);
    const { count } = await supabase
      .from("notifications").select("id", { count: "exact", head: true })
      .eq("request_id", r.id).eq("kind", kind);
    if (count) continue;
    const { count: missing } = await supabase
      .from("submissions").select("id", { count: "exact", head: true })
      .eq("request_id", r.id).in("status", ["pending", "rejected"]);
    if (!missing) continue;
    const { data: org } = await supabase.from("organizations").select("name").eq("id", r.org_id).maybeSingle();
    const mail = reminderEmail(offset, r.title, org?.name ?? "Your agency", missing, `${appUrl}/c/${r.token}`);
    await supabase.from("notifications").insert({
      org_id: r.org_id, request_id: r.id, channel: "email", kind,
      recipient: r.client_email, subject: mail.subject, body: mail.body,
    });
  }
}

export const Route = createFileRoute("/api/public/cron/notifications")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = (process.env["CRON_SECRET"] ?? "").trim();
        const auth = request.headers.get("authorization") ?? "";
        if (!secret || auth !== `Bearer ${secret}`) return unauthorized();

        const { createAdminSupabase } = await import("@/integrations/supabase/client.server");
        const supabase = createAdminSupabase();

        await scheduleReminders(supabase).catch((e) => console.error("auto reminders failed", e));

        const { data: batch, error } = await supabase.rpc("claim_notifications", { _batch: 10 });
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const apiKey = (process.env["BREVO_API_KEY"] ?? "").trim();
        const from = (process.env["EMAIL_FROM"] ?? "").trim() || `Lockcopy <${DEFAULT_SENDER}>`;

        const items = (batch ?? []) as unknown as Notification[];
        let sent = 0;
        let failed = 0;
        for (const n of items) {
          let err: string | null = null;
          if (n.channel !== "email") {
            err = `unsupported channel: ${n.channel}`;
          } else if (!apiKey) {
            err = "BREVO_API_KEY is not configured on the server.";
          } else {
            err = await sendEmail(from, apiKey, n);
          }
          await supabase.rpc("finish_notification", { _id: n.id, _ok: !err, _err: err });
          if (err) failed += 1;
          else sent += 1;
        }

        return new Response(JSON.stringify({ processed: items.length, sent, failed }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
