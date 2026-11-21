import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Cobrança com Stripe.
 *
 * Regra do produto: o teste de 14 dias só começa depois de o Stripe confirmar
 * o cartão. Por isso o checkout é criado com trial_period_days e o estado da
 * conta é aplicado pelo webhook, nunca por código do browser.
 */

const PLANS = ["solo", "agency"] as const;
type Plan = (typeof PLANS)[number];

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

function priceFor(plan: Plan) {
  return plan === "solo" ? env("STRIPE_PRICE_SOLO") : env("STRIPE_PRICE_AGENCY");
}

/**
 * Cria a sessão de checkout do Stripe e devolve o URL para onde o browser
 * vai pagar. Nada muda na conta aqui: só o webhook confirma.
 */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ plan: z.enum(PLANS) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const secret = env("STRIPE_SECRET_KEY");
    const price = priceFor(data.plan);
    if (!secret) throw new Error("Stripe não está configurado no servidor.");
    if (!price) throw new Error(`Preço do plano ${data.plan} não configurado.`);

    const { data: membership } = await context.supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!membership) throw new Error("Sem organização associada a esta conta.");

    const { data: org } = await context.supabase
      .from("organizations")
      .select("id, name, slug, stripe_customer_id")
      .eq("id", membership.org_id)
      .maybeSingle();

    if (!org) throw new Error("Conta não encontrada.");

    const { data: limits } = await context.supabase
      .from("plan_limits")
      .select("trial_days")
      .eq("plan", data.plan)
      .maybeSingle();

    const origin = env("APP_URL") || "https://lockcopy.com";
    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("line_items[0][price]", price);
    body.set("line_items[0][quantity]", "1");
    body.set("client_reference_id", org.id);
    body.set("metadata[org_id]", org.id);
    body.set("metadata[plan]", data.plan);
    body.set("success_url", `${origin}/app?checkout=ok`);
    body.set("cancel_url", `${origin}/app?checkout=cancel`);
    if (limits?.trial_days) {
      body.set("subscription_data[trial_period_days]", String(limits.trial_days));
    }
    if (org.stripe_customer_id) {
      body.set("customer", org.stripe_customer_id);
    } else {
      const { data: sessionUser } = await context.supabase.auth.getUser(context.accessToken);
      const email = sessionUser.user?.email;
      if (email) body.set("customer_email", email);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const session = (await response.json()) as {
      url?: string;
      error?: { message?: string };
    };

    if (!response.ok || !session.url) {
      throw new Error(session.error?.message ?? "Não foi possível abrir o pagamento.");
    }

    return { url: session.url };
  });
