import { createFileRoute } from "@tanstack/react-router";

/**
 * Trabalhador de emails e lembretes.
 *
 * Rota pública (sem sessão de utilizador), mas protegida por um segredo:
 * o chamador (cron externo, ex. cron-job.org ou agendamento do Supabase)
 * tem de enviar `Authorization: Bearer <CRON_SECRET>`.
 *
 * Fluxo: reivindica notificações pendentes (claim_notifications), envia cada
 * uma via Brevo e marca o resultado (finish_notification). Sem BREVO_API_KEY
 * as notificações são marcadas como falhadas com erro explícito, para não
 * fingirem envio.
 */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

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
  return { email: from.trim() };
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

export const Route = createFileRoute("/api/public/cron/notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = (process.env["CRON_SECRET"] ?? "").trim();
        const auth = request.headers.get("authorization") ?? "";
        if (!secret || auth !== `Bearer ${secret}`) return unauthorized();

        const { createAdminSupabase } = await import("@/integrations/supabase/client.server");
        const supabase = createAdminSupabase();

        const { data: batch, error } = await supabase.rpc("claim_notifications", { _batch: 10 });
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const apiKey = (process.env["BREVO_API_KEY"] ?? "").trim();
        const from = (process.env["EMAIL_FROM"] ?? "").trim() || "Lockcopy <notificacoes@lockcopy.com>";

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
