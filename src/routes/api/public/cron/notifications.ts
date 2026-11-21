import { createFileRoute } from "@tanstack/react-router";

/**
 * Trabalhador de emails e lembretes.
 *
 * Rota pública (sem sessão de utilizador), mas protegida por um segredo:
 * o chamador (cron externo, ex. cron-job.org ou agendamento do Supabase)
 * tem de enviar `Authorization: Bearer <CRON_SECRET>`.
 *
 * Fluxo: reivindica notificações pendentes (claim_notifications), envia cada
 * uma via Resend e marca o resultado (finish_notification). Sem RESEND_API_KEY
 * as notificações são marcadas como falhadas com erro explícito, para não
 * fingirem envio.
 */

const RESEND_URL = "https://api.resend.com/emails";

type Notification = {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "não autorizado" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

async function sendEmail(from: string, apiKey: string, n: Notification): Promise<string | null> {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [n.recipient],
      subject: n.subject,
      text: n.body,
    }),
  });
  if (res.ok) return null;
  const detail = (await res.text()).slice(0, 300);
  return `Resend ${res.status}: ${detail}`;
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

        const apiKey = (process.env["RESEND_API_KEY"] ?? "").trim();
        const from = (process.env["EMAIL_FROM"] ?? "").trim() || "Lockcopy <notificacoes@lockcopy.com>";

        const items = (batch ?? []) as unknown as Notification[];
        let sent = 0;
        let failed = 0;
        for (const n of items) {
          let err: string | null = null;
          if (n.channel !== "email") {
            err = `canal não suportado: ${n.channel}`;
          } else if (!apiKey) {
            err = "RESEND_API_KEY não configurada no servidor.";
          } else {
            err = await sendEmail(from, apiKey, n);
          }
          await supabase.rpc("finish_notification", { _id: n.id, _ok: !err, _err: err });
          if (err) failed += 1;
          else sent += 1;
        }

        return new Response(JSON.stringify({ processadas: items.length, enviadas: sent, falhadas: failed }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
