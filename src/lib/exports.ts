/** Exports built from a real request (not a live sync). */
import { slugify } from "@/lib/lockcopy";

export type ExportField = { id: string; label: string; field_type: string };
export type ExportSection = { id: string; title: string; fields: ExportField[] };
export type ExportFile = { field_id: string; file_name: string; storage_path: string; webp_storage_path: string | null };
export type ExportInput = {
  title: string;
  client: string;
  sections: ExportSection[];
  text: Record<string, string>;
  files: ExportFile[];
};

export function webflowCsv(x: ExportInput) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [["Name", "Slug", "Page", "Field", "Content", "Files"]];
  for (const s of x.sections)
    for (const f of s.fields)
      rows.push([
        f.label,
        slugify(`${s.title}-${f.label}`),
        s.title,
        slugify(f.label),
        x.text[f.id] ?? "",
        x.files.filter((y) => y.field_id === f.id).map((y) => y.file_name).join("; "),
      ]);
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function framerJson(x: ExportInput) {
  return JSON.stringify(
    {
      project: x.title,
      client: x.client,
      pages: x.sections.map((s) => ({
        page: s.title,
        slug: slugify(s.title),
        fields: Object.fromEntries(
          s.fields.map((f) => [
            slugify(f.label),
            { label: f.label, text: x.text[f.id] ?? "", files: x.files.filter((y) => y.field_id === f.id).map((y) => y.file_name) },
          ]),
        ),
      })),
    },
    null,
    2,
  );
}

/** Caminho de cada ficheiro dentro do ZIP: pagina/campo/original|webp/nome. Nomes repetidos ganham sufixo. */
export function zipEntries(x: ExportInput) {
  const out: Array<{ zipPath: string; storagePath: string }> = [];
  const used = new Set<string>();
  const unique = (p: string) => {
    if (!used.has(p)) return used.add(p), p;
    const dot = p.lastIndexOf(".");
    for (let i = 2; ; i++) {
      const c = dot > p.lastIndexOf("/") ? `${p.slice(0, dot)}-${i}${p.slice(dot)}` : `${p}-${i}`;
      if (!used.has(c)) return used.add(c), c;
    }
  };
  for (const s of x.sections)
    for (const f of s.fields)
      for (const file of x.files.filter((y) => y.field_id === f.id)) {
        const base = `${slugify(s.title) || "page"}/${slugify(f.label) || "field"}`;
        out.push({ zipPath: unique(`${base}/original/${file.file_name}`), storagePath: file.storage_path });
        if (file.webp_storage_path)
          out.push({ zipPath: unique(`${base}/webp/${file.file_name.replace(/\.[^.]+$/, "")}.webp`), storagePath: file.webp_storage_path });
      }
  return out;
}
