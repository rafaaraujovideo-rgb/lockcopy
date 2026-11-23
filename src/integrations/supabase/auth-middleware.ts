import { createMiddleware } from "@tanstack/react-start";

/**
 * Captures the Authorization header on each request. It is request middleware
 * because only there is the `request` object available.
 */
const bearerHeader = createMiddleware().server(async ({ next, request }) => {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return next({ context: { bearer } });
});

/**
 * Server-side gate for functions that need the signed-in agency user.
 * Validates the bearer with Supabase Auth and hands the handler a client whose
 * queries run under that user's Row Level Security.
 */
export const requireSupabaseAuth = createMiddleware({ type: "function" })
  .middleware([bearerHeader])
  .server(async ({ next, context }) => {
    const token = context.bearer;
    if (!token) throw new Error("Not signed in: please sign in first.");

    // client.server is loaded only here so it stays out of the browser bundle.
    const { createServerSupabase } = await import("./client.server");
    const supabase = createServerSupabase({ accessToken: token });
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) throw new Error("Session invalid or expired.");

    return next({
      context: {
        supabase,
        userId: data.user.id,
        accessToken: token,
      },
    });
  });
