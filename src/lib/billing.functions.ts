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

function priceFor(plan: Plan, cycle: "month" | "year") {
  const base = plan === "solo" ? "STRIPE_PRICE_SOLO" : "STRIPE_PRICE_AGENCY";
  return cycle === "year" ? env(`${base}_YEAR`) : env(base);
}

/**
 * Cria a sessão de checkout do Stripe e devolve o URL para onde o browser
 * vai pagar. Nada muda na conta aqui: só o webhook confirma.
 */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ plan: z.enum(PLANS), cycle: z.enum(["month", "year"]).default("month") }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const secret = env("STRIPE_SECRET_KEY");
    const price = priceFor(data.plan, data.cycle);
    if (!secret) throw new Error("Stripe is not configured on the server.");
    if (!price) throw new Error(`Price for the ${data.plan} plan (${data.cycle === "year" ? "yearly" : "monthly"}) is not configured.`);

    const { data: membership } = await context.supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!membership) throw new Error("No organization linked to this account.");

    const { data: org } = await context.supabase
      .from("organizations")
      .select("id, name, slug, stripe_customer_id")
      .eq("id", membership.org_id)
      .maybeSingle();

    if (!org) throw new Error("Account not found.");

    const { data: limits } = await context.supabase
      .from("plan_limits")
      .select("trial_days")
      .eq("plan", data.plan)
      .maybeSingle();

    const origin = env("APP_URL") || "https://lockcopy.com";
    const body = new URLSearchParams();
    body.set("mode", "subscription");
    // O cartão é sempre pedido, mesmo com teste grátis: sem cartão, não há teste.
    body.set("payment_method_collection", "always");
    body.set("line_items[0][price]", price);
    body.set("line_items[0][quantity]", "1");
    body.set("client_reference_id", org.id);
    body.set("metadata[org_id]", org.id);
    body.set("metadata[plan]", data.plan);
    body.set("subscription_data[metadata][org_id]", org.id);
    body.set("subscription_data[metadata][plan]", data.plan);
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
      throw new Error(session.error?.message ?? "Could not open checkout.");
    }

    return { url: session.url };
  });

/** Abre o portal do Stripe para gerir cartão, faturas ou cancelar. */
export const openBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = env("STRIPE_SECRET_KEY");
    if (!secret) throw new Error("Stripe is not configured on the server.");

    const { data: membership } = await context.supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!membership) throw new Error("No organization linked to this account.");

    const { data: org } = await context.supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", membership.org_id)
      .maybeSingle();
    if (!org?.stripe_customer_id) throw new Error("No card registered yet.");

    const origin = env("APP_URL") || "https://lockcopy.com";
    const body = new URLSearchParams();
    body.set("customer", org.stripe_customer_id);
    body.set("return_url", `${origin}/app/faturacao`);

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const session = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !session.url) {
      throw new Error(session.error?.message ?? "Could not open card management.");
    }
    return { url: session.url };
  });
