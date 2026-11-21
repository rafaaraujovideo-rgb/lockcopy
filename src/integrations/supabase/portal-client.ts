import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase-types";

let cached: SupabaseClient<Database> | null = null;

/**
 * Cliente anónimo do portal: nunca usa a sessão da agência, para que os
 * uploads passem só pelas regras do link (papel anon + token).
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
