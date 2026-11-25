import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const API = "https://api.webflow.com/v2";

async function wf(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, accept: "application/json", "content-type": "application/json" },
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Webflow ${path} [${res.status}]: ${body}`);
    let m = "";
    try { m = JSON.parse(body).message ?? ""; } catch { /* not json */ }
    if (res.status === 401) throw new Error("Webflow rejected this token. Check it has CMS read and write access.");
    if (res.status === 403) throw new Error("This token can't access that site. Create a token with CMS read and write access.");
    throw new Error(`Webflow error (${res.status})${m ? `: ${m}` : "."}`);
  }
  return body ? JSON.parse(body) : {};
}

const token = z.string().trim().min(20).max(300);

/** Lists the sites and CMS collections the token can reach. */
export const webflowCollections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ token }).parse(d))
  .handler(async ({ data }) => {
    const { sites = [] } = await wf(data.token, "/sites");
    const out: Array<{ id: string; name: string; site: string }> = [];
    for (const s of sites.slice(0, 20)) {
      const { collections = [] } = await wf(data.token, `/sites/${s.id}/collections`);
      for (const c of collections) out.push({ id: c.id, name: c.displayName, site: s.displayName });
    }
    return out;
  });

export const webflowFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ token, collectionId: z.string().min(5).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const c = await wf(data.token, `/collections/${data.collectionId}`);
    return (c.fields ?? []).map((f: { slug: string; displayName: string; type: string; isRequired?: boolean }) => ({
      slug: f.slug, displayName: f.displayName, type: f.type, isRequired: !!f.isRequired,
    }));
  });

/** Creates draft CMS items — nothing goes live until the designer publishes in Webflow. */
export const webflowPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      token,
      collectionId: z.string().min(5).max(64),
      items: z.array(z.record(z.string(), z.unknown())).min(1).max(50),
    }).parse(d))
  .handler(async ({ data }) => {
    let created = 0;
    for (const fieldData of data.items) {
      await wf(data.token, `/collections/${data.collectionId}/items`, {
        method: "POST",
        body: JSON.stringify({ isDraft: true, isArchived: false, fieldData }),
      });
      created++;
    }
    return { created };
  });
