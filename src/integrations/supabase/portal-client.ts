import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase-types";

let cached: SupabaseClient<Database> | null = null;

/**
 * Anonymous portal client: never uses the agency session, so
 * uploads only pass the link rules (anon role + token).
 */
export function getPortalSupabase(): SupabaseClient<Database> {
  if (!cached) {
    const url = (import.meta.env["VITE_SUPABASE_URL"] ?? "").trim();
    const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "").trim();
    cached = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "lockcopy-portal" },
    });
  }
  return cached;
}
