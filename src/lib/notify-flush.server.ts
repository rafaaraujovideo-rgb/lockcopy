/** Sends queued notifications through Brevo right away (server-only). */
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
export const DEFAULT_SENDER = "notify@lockcopy.com";

type Notification = { id: string; channel: string; recipient: string; subject: string; body: string };
type Admin = ReturnType<typeof import("@/integrations/supabase/client.server").createAdminSupabase>;

export function parseFrom(from: string): { name?: string; email: string } {
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
    body: JSON.stringify({ sender: parseFrom(from), to: [{ email: n.recipient }], subject: n.subject, textContent: n.body }),
  });
  if (res.ok) return null;
  return `Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`;
}

export async function flushNotifications(supabase: Admin, batch = 10, portalToken?: string) {
  const { data, error } = portalToken
    ? await (supabase.rpc as unknown as (f: string, a: unknown) => Promise<{ data: unknown; error: { message: string } | null }>)("claim_portal_notifications", { _token: portalToken, _batch: batch })
    : await supabase.rpc("claim_notifications", { _batch: batch });
  if (error) throw new Error(error.message);
  const apiKey = (process.env["BREVO_API_KEY"] ?? "").trim();
  const from = (process.env["EMAIL_FROM"] ?? "").trim() || `Lockcopy <${DEFAULT_SENDER}>`;
  const items = (data ?? []) as unknown as Notification[];
  let sent = 0, failed = 0;
  for (const n of items) {
    let err: string | null = null;
    if (n.channel !== "email") err = `unsupported channel: ${n.channel}`;
    else if (!apiKey) err = "BREVO_API_KEY is not configured on the server.";
    else err = await sendEmail(from, apiKey, n);
    await supabase.rpc("finish_notification", { _id: n.id, _ok: !err, _err: err });
    if (err) failed += 1; else sent += 1;
  }
  return { processed: items.length, sent, failed };
}
