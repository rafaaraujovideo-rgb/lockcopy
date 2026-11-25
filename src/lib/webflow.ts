/** Pure mapping from a Lockcopy request to Webflow CMS items (one item per page). */
import { slugify } from "@/lib/lockcopy";
import type { ExportInput } from "@/lib/exports";

export type WfField = { slug: string; displayName: string; type: string; isRequired?: boolean };
export type WfItem = { page: string; fieldData: Record<string, unknown>; matched: string[] };

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toRich = (s: string) => s.trim().split(/\n{2,}/).map((p) => `<p>${escHtml(p).replace(/\n/g, "<br>")}</p>`).join("");

/**
 * Matches Webflow fields to Lockcopy fields by slug or display name.
 * Only approved answers are sent. imageUrl maps a field id to temporary file URLs.
 */
export function buildWebflowItems(
  x: ExportInput,
  wfFields: WfField[],
  approved: Set<string>,
  imageUrls: Record<string, string[]> = {},
): WfItem[] {
  return x.sections.map((s) => {
    const fieldData: Record<string, unknown> = { name: s.title, slug: slugify(`${x.client}-${s.title}`) || "page" };
    const matched: string[] = [];
    for (const wf of wfFields) {
      if (wf.slug === "name" || wf.slug === "slug") continue;
      const keys = new Set([wf.slug, slugify(wf.displayName)]);
      const f = s.fields.find((y) => keys.has(slugify(y.label)));
      if (!f || !approved.has(f.id)) continue;
      const text = (x.text[f.id] ?? "").trim();
      const urls = imageUrls[f.id] ?? [];
      if (wf.type === "PlainText" && text) fieldData[wf.slug] = text;
      else if (wf.type === "RichText" && text) fieldData[wf.slug] = toRich(text);
      else if (wf.type === "Image" && urls[0]) fieldData[wf.slug] = { url: urls[0] };
      else if (wf.type === "MultiImage" && urls.length) fieldData[wf.slug] = urls.slice(0, 25).map((url) => ({ url }));
      else continue;
      matched.push(wf.displayName);
    }
    return { page: s.title, fieldData, matched };
  });
}
