import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ADMIN_EMAIL } from "@/lib/admin";

const KIND = { idea: "Idea", problem: "Problem", question: "Question" } as const;

/** Saves feedback as the signed-in user (RLS) and emails it to the owner. */
export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(["idea", "problem", "question"]),
      message: z.string().trim().min(3).max(4000),
      page: z.string().max(200).optional(),
      orgId: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as unknown as { from: (t: string) => any };
    const { error } = await db.from("feedback").insert({
      user_id: context.userId, org_id: data.orgId ?? null, kind: data.kind, message: data.message, page: data.page ?? null,
    });
    if (error) throw new Error("Could not send your message. Please try again.");

    const { data: me } = await context.supabase.auth.getUser(context.accessToken);
    const from = me.user?.email ?? "unknown";
    const apiKey = (process.env["BREVO_API_KEY"] ?? "").trim();
    if (apiKey) {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: "Lockcopy", email: "notify@lockcopy.com" },
          to: [{ email: ADMIN_EMAIL }],
          ...(me.user?.email ? { replyTo: { email: me.user.email } } : {}),
          subject: `${KIND[data.kind]} from ${from}`,
          textContent: `${data.message}\n\n—\nFrom: ${from}\nPage: ${data.page ?? "-"}\n\nReply to this email to answer them directly.`,
        }),
      }).catch(() => null);
    }
    return { ok: true };
  });
