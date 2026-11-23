import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdminUser } from "@/lib/admin";

export type AdminOrg = {
  id: string;
  name: string;
  plan: string;
  status: string;
  ownerEmail: string | null;
  stripeCustomer: string | null;
  trialEndsAt: string | null;
  periodEndsAt: string | null;
  createdAt: string;
};

export type AdminOverview = {
  orgs: AdminOrg[];
  stripe: { live: boolean; mrrCents: number; trialing: number; active: number; pastDue: number; error: string | null };
};

/** Owner-only overview. Access is decided on the server from the verified Auth user. */
export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { data: me } = await context.supabase.auth.getUser(context.accessToken);
    if (!isAdminUser(me.user)) throw new Error("Forbidden");

    const { createAdminSupabase } = await import("@/integrations/supabase/client.server");
    const admin = createAdminSupabase();

    const { data: orgs, error } = await admin
      .from("organizations")
      .select("id, name, plan, subscription_status, stripe_customer_id, trial_ends_at, current_period_ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const { data: owners } = await admin.from("org_members").select("org_id, user_id, role").eq("role", "owner");
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? null]));
    const ownerByOrg = new Map((owners ?? []).map((o) => [o.org_id, emailById.get(o.user_id) ?? null]));

    const test = (process.env["STRIPE_MODE"] ?? "").trim() === "test";
    const secret = (process.env[test ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_SECRET_KEY"] ?? "").trim();
    const stripe = { live: !test, mrrCents: 0, trialing: 0, active: 0, pastDue: 0, error: null as string | null };
    if (secret) {
      try {
        const res = await fetch("https://api.stripe.com/v1/subscriptions?status=all&limit=100", {
          headers: { Authorization: `Bearer ${secret}` },
        });
        const body = (await res.json()) as {
          data?: { status: string; items?: { data?: { quantity?: number; price?: { unit_amount?: number; recurring?: { interval?: string } } }[] } }[];
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(body.error?.message ?? "Stripe error");
        for (const s of body.data ?? []) {
          if (s.status === "trialing") stripe.trialing += 1;
          if (s.status === "past_due") stripe.pastDue += 1;
          if (s.status === "active") {
            stripe.active += 1;
            for (const it of s.items?.data ?? []) {
              const amount = (it.price?.unit_amount ?? 0) * (it.quantity ?? 1);
              stripe.mrrCents += it.price?.recurring?.interval === "year" ? Math.round(amount / 12) : amount;
            }
          }
        }
      } catch (e) {
        stripe.error = e instanceof Error ? e.message : "Stripe error";
      }
    } else {
      stripe.error = "Stripe is not configured.";
    }

    return {
      stripe,
      orgs: (orgs ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        plan: o.plan,
        status: o.subscription_status,
        ownerEmail: ownerByOrg.get(o.id) ?? null,
        stripeCustomer: o.stripe_customer_id,
        trialEndsAt: o.trial_ends_at,
        periodEndsAt: o.current_period_ends_at,
        createdAt: o.created_at,
      })),
    };
  });
