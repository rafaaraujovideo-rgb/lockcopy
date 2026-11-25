import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Creates a team invite (owner only, enforced by RLS) and emails the join link. */
export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().uuid(), email: z.string().trim().toLowerCase().email().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a: unknown) => any };
    const { data: members } = await db.rpc("list_org_members", { _org: data.orgId });
    if ((members ?? []).some((m: { email: string }) => m.email?.toLowerCase() === data.email)) {
      throw new Error("This person is already on your team.");
    }
    const { data: inv, error } = await db
      .from("org_invites")
      .insert({ org_id: data.orgId, email: data.email, invited_by: userId })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    const { data: org } = await db.from("organizations").select("name").eq("id", data.orgId).maybeSingle();

    const origin = (process.env["APP_URL"] ?? "").trim() || "https://lockcopy.com";
    const link = `${origin}/join/${inv.token}`;
    const apiKey = (process.env["BREVO_API_KEY"] ?? "").trim();
    const fromRaw = (process.env["EMAIL_FROM"] ?? "").trim() || "Lockcopy <notify@lockcopy.com>";
    const m = /<([^>]+)>/.exec(fromRaw) ?? /([^\s<>()]+@[^\s<>()]+\.[^\s<>()]+)/.exec(fromRaw);
    let emailed = false;
    if (apiKey) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: "Lockcopy", email: m?.[1] ?? "notify@lockcopy.com" },
          to: [{ email: data.email }],
          subject: `Join ${org?.name ?? "an agency"} on Lockcopy`,
          textContent: `Hi,\n\n${org?.name ?? "An agency"} invited you to join their team on Lockcopy. Use ${data.email} to sign in or create an account, then accept the invite here:\n\n${link}\n\nThis invite expires in 14 days.`,
        }),
      });
      emailed = res.ok;
    }
    return { link, emailed };
  });
