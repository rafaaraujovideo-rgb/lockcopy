import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PLANS } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lockcopy — pare de perseguir clientes por conteúdos" },
      { name: "description", content: "Checklists por página, uploads organizados e exportação para Webflow e Framer. Para freelancers e agências web." },
      { property: "og:title", content: "Lockcopy — pare de perseguir clientes por conteúdos" },
      { property: "og:description", content: "Checklists por página, uploads organizados e exportação para Webflow e Framer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const Logo = () => (
  <span className="flex items-center gap-2 font-display text-3xl">
    <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-accent-foreground">◆</span>
    Lock<em className="-ml-2 text-accent">copy</em>
  </span>
);

const rows: [string, string, string][] = [
  ["Início", "Frase principal", "trancado"],
  ["Início", "Fotografia de capa", "trancado"],
  ["Sobre", "A vossa história", "ajuste"],
  ["Serviços", "Lista e preços", "enviado"],
  ["Contactos", "Logótipo SVG", "à espera"],
];
const tone: Record<string, string> = {
  trancado: "bg-accent text-accent-foreground",
  ajuste: "bg-destructive/20 text-destructive",
  enviado: "bg-warn text-warn-foreground",
  "à espera": "bg-ink-line text-ink-muted",
};

function Landing() {
  const [billing, setBilling] = useState<"month" | "year">("month");
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="grid-ink pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Logo />
          <nav className="flex items-center gap-5 text-sm text-ink-muted">
            <a href="#precos" className="hidden hover:text-ink-foreground sm:inline">Preços</a>
            <Link to="/app" className="hover:text-ink-foreground">Entrar</Link>
            <Link to="/comecar" className="rounded-full bg-accent px-4 py-2 font-medium text-accent-foreground">Começar</Link>
          </nav>
        </header>

        <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-12 md:grid-cols-[1.15fr_1fr] md:pt-20">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-line px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Para freelancers e agências web
            </p>
            <h1 className="font-display text-6xl leading-[0.95] md:text-8xl">
              Recolha o conteúdo.<br /><em className="text-accent">Tranque-o.</em> Publique.
            </h1>
            <p className="mt-8 max-w-lg text-lg text-ink-muted">
              Um link por cliente, sem conta. Textos e ficheiros chegam página a página — você aprova, o conteúdo fica trancado e sai pronto para Webflow ou Framer.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/comecar" className="rounded-full bg-accent px-7 py-3.5 font-medium text-accent-foreground shadow-lime transition-transform hover:-translate-y-0.5">Começar teste de 14 dias →</Link>
              <Link to="/c/$token" params={{ token: "demo-x7k2q9" }} className="rounded-full border border-ink-line px-7 py-3.5 hover:bg-ink-line">Ver o que o cliente vê</Link>
            </div>
            <p className="mt-4 font-mono text-xs text-ink-muted">Cartão pedido no início · 0 € cobrados durante 14 dias</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl" />
            <div className="relative rounded-2xl border border-ink-line bg-ink p-1 shadow-2xl">
              <div className="flex items-center justify-between rounded-t-xl px-4 py-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Clínica Sousa / Novo site</span>
                <span className="font-mono text-[11px] text-accent">2 de 5 trancados</span>
              </div>
              <div className="mx-4 mb-3 h-1 rounded-full bg-ink-line"><div className="h-1 w-2/5 rounded-full bg-accent" /></div>
              <div className="rounded-xl bg-ink-line/40">
                {rows.map(([pg, f, s]) => (
                  <div key={f} className="flex items-center justify-between border-b border-ink-line px-4 py-3.5 last:border-0">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{pg}</p>
                      <p className="text-sm">{f}</p>
                    </div>
                    <span className={"rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider " + tone[s]}>
                      {s === "trancado" ? "◆ " : ""}{s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Como funciona</p>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {[
            ["01", "Pedir", "Escolha um modelo: institucional, landing, e-commerce ou rebranding."],
            ["02", "Recolher", "O cliente abre o link privado e preenche. Tudo grava sozinho."],
            ["03", "Trancar", "Aprove campo a campo ou peça ajuste com nota. Aprovado fica fechado."],
            ["04", "Exportar", "ZIP por página, CSV para Webflow e JSON para Framer."],
          ].map(([n, t, d]) => (
            <div key={n} className="bg-card p-7">
              <span className="font-mono text-xs text-muted-foreground">{n}</span>
              <h3 className="mt-6 font-display text-4xl">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-6xl px-5 pb-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-6xl">Preços <em className="text-muted-foreground">simples</em></h2>
          <div className="flex rounded-full border border-border bg-card p-1 text-sm">
            {(["month", "year"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} className={"rounded-full px-4 py-1.5 " + (billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{b === "month" ? "Mensal" : "Anual"}</button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(["solo", "agency"] as const).map((k) => {
            const p = PLANS[k];
            const dark = k === "agency";
            return (
              <div key={k} className={"rounded-2xl p-8 " + (dark ? "bg-ink text-ink-foreground" : "border border-border bg-card shadow-card")}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-4xl">{p.name}</h3>
                  {dark && <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">Mais escolhido</span>}
                </div>
                <p className="mt-4"><span className="font-display text-7xl">${billing === "month" ? p.month : p.year}</span><span className={dark ? "text-ink-muted" : "text-muted-foreground"}>/{billing === "month" ? "mês" : "ano"}</span></p>
                <ul className={"mt-6 space-y-2 text-sm " + (dark ? "text-ink-muted" : "text-muted-foreground")}>
                  <li>◆ {p.requests} pedidos ativos</li><li>◆ {p.users} {p.users > 1 ? "utilizadores" : "utilizador"}</li><li>◆ {p.storageGb} GB de ficheiros</li>
                </ul>
                <Link to="/comecar" search={{ plano: k, ciclo: billing }} className={"mt-8 block rounded-full py-3 text-center font-medium " + (dark ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>Experimentar 14 dias</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-5 font-mono text-xs text-muted-foreground">Durante o teste: 1 pedido ativo e 500 MB · preços sem impostos</p>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-8 text-sm text-muted-foreground">
          <span className="font-display text-xl text-foreground">Lockcopy™</span>
          <span>Conteúdo do cliente, trancado e pronto.</span>
        </div>
      </footer>
    </div>
  );
}
