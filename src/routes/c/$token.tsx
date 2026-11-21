import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStore, actions, progress, linkState, UPLOAD, WEBP_OK, type Field, type Request, type FileItem } from "@/lib/store";
import { Badge, Card, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/c/$token")({
  head: () => ({
    meta: [
      { title: "Enviar conteúdos do site — Brief" },
      { name: "description", content: "Preencha os textos e carregue os ficheiros pedidos pela sua agência." },
      { property: "og:title", content: "Enviar conteúdos do site" },
      { property: "og:description", content: "Preencha os textos e carregue os ficheiros pedidos pela sua agência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Portal,
});

function Portal() {
  const { token } = Route.useParams();
  const r = useStore((s) => s.requests.find((x) => x.token === token));
  if (!r || linkState(r) !== "ativo")
    return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center">
        <div><h1 className="font-display text-3xl font-bold">Este link já não está disponível</h1><p className="mt-2 text-muted-foreground">Peça um novo link à sua agência.</p></div>
      </div>
    );
  const p = progress(r);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-3">
          <p className="text-xs text-muted-foreground">Pedido para {r.client} · entregar até {r.deadline}</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="font-display text-lg font-semibold">{r.title}</p>
            <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${p.pct}%` }} /></div>
            <span className="text-xs">{p.pct}%</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-5 py-8">
        <p className="text-sm text-muted-foreground">Tudo é guardado automaticamente. Pode sair e voltar mais tarde com este mesmo link.</p>
        {r.sections.map((s) => (
          <Card key={s.id}>
            <h2 className="font-display text-2xl font-semibold">{s.page}</h2>
            {s.fields.map((fl) => <FieldInput key={fl.id} r={r} fl={fl} />)}
          </Card>
        ))}
      </main>
    </div>
  );
}

function FieldInput({ r, fl }: { r: Request; fl: Field }) {
  const a = r.answers[fl.id]!;
  const [text, setText] = useState(a.text);
  const [saved, setSaved] = useState<"" | "a guardar" | "guardado">("");
  const [uploads, setUploads] = useState<{ name: string; pct: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const first = useRef(true);
  const locked = a.status === "aprovado";

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved("a guardar");
    const t = setTimeout(() => {
      actions.saveAnswer(r.token, fl.id, { text, status: text.trim() || a.files.length ? "enviado" : "vazio" }, `Atualizou '${fl.label}'`);
      setSaved("guardado");
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = []; const errs: string[] = [];
    Array.from(list).forEach((file) => {
      const type = file.type || (file.name.toLowerCase().endsWith(".heic") ? "image/heic" : "");
      if (!UPLOAD.types.includes(type)) errs.push(`${file.name}: tipo não aceite`);
      else if (file.size > UPLOAD.maxBytes) errs.push(`${file.name}: maior que 50 MB`);
      else ok.push(file);
    });
    setErrors(errs);
    ok.forEach((file) => {
      setUploads((u) => [...u, { name: file.name, pct: 0 }]);
      let pct = 0;
      const iv = setInterval(() => {
        pct = Math.min(100, pct + 20 + Math.random() * 25);
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, pct } : x)));
        if (pct >= 100) {
          clearInterval(iv);
          setUploads((u) => u.filter((x) => x.name !== file.name));
          const type = file.type || "image/heic";
          const item: FileItem = { name: file.name, size: file.size, type, webp: WEBP_OK.includes(type) ? "ok" : type === "image/heic" ? "pending" : "original" };
          const current = r.answers[fl.id]!;
          actions.saveAnswer(r.token, fl.id, { files: [...current.files, item], status: "enviado" }, `Carregou ${file.name} em '${fl.label}'`);
        }
      }, 250);
    });
  };

  return (
    <div className="border-t border-border py-4 first-of-type:border-0">
      <div className="flex items-center justify-between gap-2">
        <label className="font-medium">{fl.label}</label>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">{saved}<Badge s={a.status} /></span>
      </div>
      {fl.hint && <p className="text-xs text-muted-foreground">{fl.hint}</p>}
      {a.status === "ajuste" && a.note && <p className="mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">A agência pede: {a.note}</p>}
      {fl.type === "text" && <input disabled={locked} className={inputClass + " mt-2"} value={text} onChange={(e) => setText(e.target.value)} />}
      {fl.type === "longtext" && <textarea disabled={locked} rows={4} className={inputClass + " mt-2"} value={text} onChange={(e) => setText(e.target.value)} />}
      {fl.type === "files" && (
        <div className="mt-2 space-y-2">
          {!locked && (
            <label className="flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed border-border p-5 text-sm text-muted-foreground hover:border-primary">
              Escolher ficheiros (vários de uma vez)
              <span className="text-xs">JPG, PNG, WebP, HEIC, SVG, GIF, PDF · até 50 MB</span>
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          )}
          {uploads.map((u) => (
            <div key={u.name} className="text-xs"><span>{u.name}</span><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${u.pct}%` }} /></div></div>
          ))}
          {errors.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
          <ul className="space-y-1 text-sm">{a.files.map((x) => <li key={x.name}>📎 {x.name} <span className="text-xs text-muted-foreground">{(x.size / 1e6).toFixed(1)} MB</span></li>)}</ul>
        </div>
      )}
    </div>
  );
}
