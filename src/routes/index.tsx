import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PLANS } from "@/lib/store";
import { LandingDemo } from "@/components/landing-demo";

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

function Landing() {
  const [billing, setBilling] = useState<"month" | "year">("month");
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="h-2 w-2 rounded-full bg-seal" />Lockcopy</span>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#como" className="hidden hover:text-foreground sm:inline">Como funciona</a>
          <a href="#precos" className="hidden hover:text-foreground sm:inline">Preços</a>
          <Link to="/app" className="hover:text-foreground">Entrar</Link>
          <Link to="/comecar" className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">Experimentar</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Para freelancers e agências web</p>
        <h1 className="mt-6 font-display text-4xl leading-[1.1] md:text-6xl">
          Os conteúdos do cliente,<br /><span className="text-seal">organizados e aprovados.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Envie um link. O cliente preenche textos e carrega ficheiros, página a página, sem criar conta. Você revê, aprova e exporta para Webflow ou Framer.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/comecar" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Começar teste de 14 dias</Link>
          <Link to="/c/$token" params={{ token: "demo-x7k2q9" }} className="rounded-full border border-border bg-card px-6 py-3 text-sm hover:bg-muted">Ver o que o cliente vê</Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Cartão pedido no início. Nada é cobrado durante os 14 dias.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <p className="mb-6 text-center text-sm text-muted-foreground">Veja como funciona — pode clicar em cada passo e experimentar.</p>
        <LandingDemo />
      </section>

      <section id="como" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-4">
          {[
            ["Modelos por página", "Institucional, landing, e-commerce e rebranding, prontos a enviar."],
            ["Sem conta para o cliente", "Um link privado com gravação automática e envio de ficheiros."],
            ["Revisão campo a campo", "Aprove ou peça ajuste com nota. O que é aprovado fica fechado."],
            ["Exportação limpa", "ZIP por página, CSV para Webflow e JSON para Framer."],
          ].map(([t, d], i) => (
            <div key={t}>
              <span className="text-xs text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-display text-5xl">Preços simples</h2>
          <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 text-sm">
            {(["month", "year"] as const).map((b) => (
              <button key={b} onClick={() => setBilling(b)} className={"rounded-full px-4 py-1.5 transition-colors " + (billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{b === "month" ? "Mensal" : "Anual"}</button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(["solo", "agency"] as const).map((k) => {
            const p = PLANS[k];
            return (
              <div key={k} className={"rounded-2xl border bg-card p-8 shadow-card " + (k === "agency" ? "border-primary/30" : "border-border")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  {k === "agency" && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">Recomendado</span>}
                </div>
                <p className="mt-4"><span className="font-display text-5xl">${billing === "month" ? p.month : p.year}</span><span className="text-muted-foreground"> /{billing === "month" ? "mês" : "ano"}</span></p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li>{p.requests} pedidos ativos</li><li>{p.users} {p.users > 1 ? "utilizadores" : "utilizador"}</li><li>{p.storageGb} GB de ficheiros</li>
                </ul>
                <Link to="/comecar" search={{ plano: k, ciclo: billing }} className={"mt-8 block rounded-full py-3 text-center text-sm font-medium " + (k === "agency" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted")}>Experimentar 14 dias</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Durante o teste: 1 pedido ativo e 500 MB. Preços sem impostos.</p>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-foreground"><span className="h-2 w-2 rounded-full bg-seal" />Lockcopy™</span>
          <span>Conteúdo do cliente, aprovado e pronto.</span>
        </div>
      </footer>
    </div>
  );
}
