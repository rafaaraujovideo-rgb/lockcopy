import { createMiddleware } from "@tanstack/react-start";

/**
 * Captura o cabeçalho Authorization em cada pedido. É middleware de pedido
 * porque só aí o objeto `request` está disponível.
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
    if (!token) throw new Error("Sem sessão: inicia sessão primeiro.");

    // client.server é lido só aqui para não entrar no bundle do browser.
    const { createServerSupabase } = await import("./client.server");
    const supabase = createServerSupabase({ accessToken: token });
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) throw new Error("Sessão inválida ou expirada.");

    return next({
      context: {
        supabase,
        userId: data.user.id,
        accessToken: token,
      },
    });
  });
