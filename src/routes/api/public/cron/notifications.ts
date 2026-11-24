import { createFileRoute } from "@tanstack/react-router";

import { flushNotifications } from "@/lib/notify-flush.server";
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

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
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

        let out;
        try { out = await flushNotifications(supabase); } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { "content-type": "application/json" } });
        }

        return new Response(JSON.stringify(out), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
