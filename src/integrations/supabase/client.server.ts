import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase-types";

type ServerClientOptions = {
  /**
   * Access token of the signed-in user. When present, every request goes out
   * with that bearer so Row Level Security applies as the user.
   */
  accessToken?: string;
};

function readKeys() {
  const url = (
    process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"] ?? ""
  ).trim();
  const key = (
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    ""
  ).trim();
  return { url, key };
}

/**
 * Server-side client using only the publishable key. Safe for public reads and
 * for calls that carry the user's bearer token; RLS still applies.
 *
 * Imported only from server functions and server routes.
 */
export function createServerSupabase(
  options: ServerClientOptions = {},
): SupabaseClient<Database> {
  const { url, key } = readKeys();
  const accessToken = options.accessToken;

  if (!url || !key) {
    throw new Error("Server is missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      // sb_ keys are not JWTs: they go only as apikey. The bearer is the user's.
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
        else headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * Privileged client (service role). Bypasses RLS, so it may only be used after
 * the caller has been verified, and never from browser code.
 */
export function createAdminSupabase(): SupabaseClient<Database> {
  const { url } = readKeys();
  // The secrets vault reserves the SUPABASE_ prefix, so the service
  // key is LOCKCOPY_DB_SECRET_KEY (the old name is accepted if present).
  const key = (
    process.env["LOCKCOPY_DB_SECRET_KEY"] ??
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    ""
  ).trim();

  if (!url || !key) {
    throw new Error("Server is missing SUPABASE_URL / LOCKCOPY_DB_SECRET_KEY.");
  }
  if (key.startsWith("sb_publishable_")) {
    throw new Error("LOCKCOPY_DB_SECRET_KEY holds the publishable key; it needs the sb_secret_ key.");
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        // Only legacy (JWT) keys go as bearer; sb_secret_ keys only as apikey.
        if (key.startsWith("eyJ")) headers.set("Authorization", `Bearer ${key}`);
        else headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      },
    },
  });
}
