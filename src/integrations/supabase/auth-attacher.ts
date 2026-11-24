import { createMiddleware } from "@tanstack/react-start";

import { getSupabase, hasSupabase } from "@/lib/supabase-browser";

/**
 * Attaches the signed-in user's bearer token to every server function call.
 * Written by hand because this project uses an external Supabase project, so
 * the generated Cloud attacher does not exist here.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    // .client() also runs during SSR: without window there is no session to read.
    if (typeof window === "undefined" || !hasSupabase) return next();

    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;

    if (!token) return next();
    return next({ headers: { Authorization: `Bearer ${token}` } });
  },
);
