import { createFileRoute } from "@tanstack/react-router";

import type { AppPlan, Json, SubscriptionStatus } from "@/lib/supabase-types";

/**
 * Webhook do Stripe.
 *
 * É a única fonte de verdade para o estado de cobrança: o browser nunca decide
 * se a conta é ativa. A assinatura do evento é verificada antes de qualquer
 * escrita, e cada evento fica registado para que repetições não dobrem efeitos.
 */

const TOLERANCE_SECONDS = 300;

type StripeObject = {
  id?: string;
  status?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
  subscription?: string | { id?: string } | null;
  customer?: string | { id?: string } | null;
  current_period_end?: number;
};

type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: StripeObject };
};

function toIso(value: number | undefined): string | null {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function mapStatus(status: string | undefined): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}

function planOf(object: StripeObject): AppPlan | null {
  const plan = object.metadata?.["plan"];
  return plan === "solo" || plan === "agency" ? plan : null;
}

async function hmacHex(key: string, message: string) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verifica Stripe-Signature: t=<ts>,v1=<hex> assinado com o segredo do webhook. */
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
) {
  if (!header || !secret) return false;

  const fields = new Map<string, string>();
  for (const piece of header.split(",")) {
    const index = piece.indexOf("=");
    if (index > 0) fields.set(piece.slice(0, index).trim(), piece.slice(index + 1).trim());
  }

  const timestamp = Number(fields.get("t"));
  const signatures = [...fields.entries()]
    .filter(([key]) => key === "v1")
    .map(([, value]) => value);

  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const key = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const expected = await hmacHex(key, `${timestamp}.${rawBody}`);

  return signatures.some((signature) => timingSafeEqual(expected, signature));
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const secret = (process.env["STRIPE_WEBHOOK_SECRET"] ?? "").trim();

        if (
          !(await verifyStripeSignature(
            rawBody,
            request.headers.get("stripe-signature"),
            secret,
          ))
        ) {
          return new Response("invalid signature", { status: 400 });
        }

        let event: StripeEvent;
        try {
          event = JSON.parse(rawBody) as StripeEvent;
        } catch {
          return new Response("invalid body", { status: 400 });
        }

        const { createAdminSupabase } = await import(
          "@/integrations/supabase/client.server"
        );
        const admin = createAdminSupabase();

        // Regista primeiro: se o evento já lá está, é repetição e não repete efeitos.
        const { error: insertError } = await admin
          .from("subscription_events")
          .insert({
            stripe_event_id: event.id,
            event_type: event.type,
            payload: (event.data?.object ?? {}) as Json,
          });

        if (insertError) {
          return Response.json({ ok: true, duplicate: insertError.code === "23505" });
        }

        const object = event.data?.object ?? {};
        const subscription =
          typeof object.subscription === "string"
            ? object.subscription
            : object.subscription?.id ?? null;
        const customer =
          typeof object.customer === "string" ? object.customer : object.customer?.id ?? null;

        let orgId: string | null = object.client_reference_id ?? object.metadata?.["org_id"] ?? null;
        // Faturas não trazem o metadata da subscrição: procura a conta pelo cliente Stripe.
        if (!orgId && customer) {
          const { data: org } = await admin
            .from("organizations")
            .select("id")
            .eq("stripe_customer_id", customer)
            .maybeSingle();
          orgId = org?.id ?? null;
        }

        if (!orgId) return Response.json({ ok: true, ignored: "no org" });

        if (event.type === "checkout.session.completed") {
          const plan = planOf(object);
          await admin.rpc("apply_subscription", {
            _org: orgId,
            _sub_id: subscription,
            _status: "trialing",
            _plan: plan,
            _customer_id: customer,
          });
          await admin.rpc("start_trial", { _org: orgId, _plan: plan ?? "solo" });
        } else if (
          event.type === "customer.subscription.created" ||
          event.type === "customer.subscription.updated"
        ) {
          await admin.rpc("apply_subscription", {
            _org: orgId,
            _sub_id: object.id ?? subscription,
            _status: mapStatus(object.status),
            _period_ends: toIso(object.current_period_end),
            _customer_id: customer,
          });
        } else if (event.type === "customer.subscription.deleted") {
          await admin.rpc("apply_subscription", { _org: orgId, _status: "canceled" });
        } else if (event.type === "invoice.payment_failed") {
          await admin.rpc("apply_subscription", { _org: orgId, _status: "past_due" });
        }

        await admin
          .from("subscription_events")
          .update({ processed_at: new Date().toISOString() })
          .eq("stripe_event_id", event.id);

        return Response.json({ ok: true });
      },
    },
  },
});
