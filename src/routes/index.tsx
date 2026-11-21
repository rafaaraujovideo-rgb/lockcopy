import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PLANS } from "@/lib/store";
import { btnClass } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brief — pare de perseguir clientes por conteúdos" },
      { name: "description", content: "Checklists por página, uploads organizados e exportação para Webflow e Framer. Para freelancers e agências web." },
      { property: "og:title", content: "Brief — pare de perseguir clientes por conteúdos" },
      { property: "og:description", content: "Checklists por página, uploads organizados e exportação para Webflow e Framer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [billing, setBilling] = useState<"month" | "year">("month");
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-2xl font-bold">Brief<span className="text-primary">.</span></span>
        <nav className="flex items-center gap-4 text-sm">
          <a href="#precos" className="hidden sm:inline">Preços</a>
          <Link to="/app" className="hover:underline">Entrar</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-10 md:grid-cols-[1.2fr_1fr] md:pt-20">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">Para freelancers e agências web</p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">Os conteúdos do cliente, página a página.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Envie um link. O cliente preenche textos e carrega ficheiros sem criar conta. Você revê, aprova e exporta para o site.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/comecar" className={btnClass + " px-6 py-3 text-base"}>Começar teste de 14 dias</Link>
            <Link to="/c/$token" params={{ token: "demo-x7k2q9" }} className="inline-flex items-center rounded-md border border-border px-6 py-3 text-base hover:bg-muted">Ver o que o cliente vê</Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Cartão pedido no início. Nada é cobrado durante os 14 dias.</p>
        </div>
        <div className="rotate-1 rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="font-display text-lg font-semibold">Clínica Sousa · Novo site</p>
          <div className="my-3 h-2 rounded-full bg-muted"><div className="h-2 w-1/3 rounded-full bg-primary" /></div>
          {[["Início · Frase principal", "enviado"], ["Início · Fotografia de capa", "enviado"], ["Sobre · A vossa história", "ajuste"], ["Contactos · Logótipo", "vazio"]].map(([l, s]) => (
            <div key={l} className="flex items-center justify-between border-t border-border py-2 text-sm">
              <span>{l}</span><span className="text-xs text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-4">
          {[
            ["Por página", "Modelos para site institucional, landing, e-commerce e rebranding."],
            ["Sem conta", "O cliente usa um link privado, com gravação automática."],
            ["Revisão", "Aprove ou peça ajuste com nota. Tudo fica no histórico."],
            ["Exportação", "ZIP por página, CSV para Webflow e JSON para Framer."],
          ].map(([t, d]) => (
            <div key={t}><h3 className="font-display text-xl font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-4xl font-bold">Preços</h2>
          <div className="flex rounded-md border border-border p-1 text-sm">
            {(["month", "year"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} className={"rounded px-3 py-1 " + (billing === b ? "bg-primary text-primary-foreground" : "")}>{b === "month" ? "Mensal" : "Anual"}</button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(["solo", "agency"] as const).map((k) => {
            const p = PLANS[k];
            return (
              <div key={k} className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
                <p className="mt-2"><span className="font-display text-4xl font-bold">${billing === "month" ? p.month : p.year}</span><span className="text-muted-foreground">/{billing === "month" ? "mês" : "ano"}</span></p>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <li>{p.requests} pedidos ativos</li><li>{p.users} {p.users > 1 ? "utilizadores" : "utilizador"}</li><li>{p.storageGb} GB de ficheiros</li>
                </ul>
                <Link to="/comecar" search={{ plano: k, ciclo: billing }} className={btnClass + " mt-6 w-full"}>Experimentar 14 dias</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Durante o teste: 1 pedido ativo e 500 MB. Preços sem impostos, a confirmar no pagamento.</p>
      </section>
    </div>
  );
}
