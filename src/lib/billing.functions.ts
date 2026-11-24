import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Billing with Stripe.
 *
 * Product rule: the 14-day trial starts in the app when the agency is
 * created (db/0009), with no card and no Stripe. Checkout is only used to
 * add a card; remaining trial days carry over so nothing is charged early. Account state is applied
 * by the webhook, never by browser code.
 */

const PLANS = ["solo", "agency"] as const;
type Plan = (typeof PLANS)[number];

/** With STRIPE_MODE=test, reads STRIPE_TEST_* instead of the live keys. */
function env(name: string) {
  const test = (process.env["STRIPE_MODE"] ?? "").trim() === "test";
  const key = test && name.startsWith("STRIPE_") ? name.replace("STRIPE_", "STRIPE_TEST_") : name;
  return (process.env[key] ?? "").trim();
}

function priceFor(plan: Plan, cycle: "month" | "year") {
  const base = plan === "solo" ? "STRIPE_PRICE_SOLO" : "STRIPE_PRICE_AGENCY";
  return cycle === "year" ? env(`${base}_YEAR`) : env(base);
}

/**
 * Creates the Stripe checkout session and returns the URL the browser
 * goes to pay. Nothing changes on the account here: only the webhook confirms.
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
      .select("org_id, role")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membership && membership.role !== "owner") throw new Error("Only the agency owner can manage billing.");

    if (!membership) throw new Error("No organization linked to this account.");

    const { data: org } = await context.supabase
      .from("organizations")
      .select("id, name, slug, stripe_customer_id, trial_ends_at")
      .eq("id", membership.org_id)
      .maybeSingle();

    if (!org) throw new Error("Account not found.");

    // The trial already runs in the app; Stripe only keeps the days left.
    const left = org.trial_ends_at ? Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 864e5) : 0;
    const trialDays = Math.max(0, left);

    const origin = env("APP_URL") || "https://lockcopy.com";
    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("locale", "en");
    // The user is here to add a card, so Stripe always asks for one.
    body.set("payment_method_collection", "always");
    body.set("line_items[0][price]", price);
    body.set("line_items[0][quantity]", "1");
    body.set("client_reference_id", org.id);
    body.set("metadata[org_id]", org.id);
    body.set("metadata[plan]", data.plan);
    body.set("subscription_data[metadata][org_id]", org.id);
    body.set("subscription_data[metadata][plan]", data.plan);
    body.set("success_url", `${origin}/app/billing?checkout=ok`);
    body.set("cancel_url", `${origin}/app/billing?checkout=cancel`);
    if (trialDays >= 1) body.set("subscription_data[trial_period_days]", String(trialDays));
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

/** Opens the Stripe portal to manage card, invoices or cancel. */
export const openBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = env("STRIPE_SECRET_KEY");
    if (!secret) throw new Error("Stripe is not configured on the server.");

    const { data: membership } = await context.supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membership && membership.role !== "owner") throw new Error("Only the agency owner can manage billing.");
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
    body.set("return_url", `${origin}/app/billing`);
    body.set("locale", "en");

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
