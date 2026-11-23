import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase-types";

const url = (import.meta.env["VITE_SUPABASE_URL"] ?? "").trim();
const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "").trim();

/** True when the app was built with a real Supabase project behind it. */
export const hasSupabase = url.length > 0 && key.length > 0;

let cached: SupabaseClient<Database> | null = null;

/**
 * Browser client for the agency dashboard. Row Level Security applies as the
 * signed-in user, so the client never needs a secret key.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!hasSupabase) {
    throw new Error(
      "No database connection: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are missing.",
    );
  }
  if (!cached) {
    cached = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "lockcopy-auth",
      },
    });
  }
  return cached;
}
