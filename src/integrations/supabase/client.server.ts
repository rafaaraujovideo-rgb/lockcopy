import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase-types";

/**
 * Server-side client using only the publishable key. Safe for public reads and
 * for calls that carry the user's bearer token; RLS still applies.
 *
 * Imported only from server functions and server routes.
 */
export function createServerSupabase(): SupabaseClient<Database> {
  const url = (
    process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"] ?? ""
  ).trim();
  const key = (
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    ""
  ).trim();

  if (!url || !key) {
    throw new Error("Servidor sem SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Privileged client (service role). Bypasses RLS, so it may only be used after
 * the caller has been verified, and never from browser code.
 */
export function createAdminSupabase(): SupabaseClient<Database> {
  const url = (
    process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"] ?? ""
  ).trim();
  const key = (process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "").trim();

  if (!url || !key) {
    throw new Error("Servidor sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
