import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PLANS, actions } from "@/lib/store";
import { Btn, Card, DemoNote, inputClass } from "@/components/ui-bits";

type Search = { plano?: "solo" | "agency"; ciclo?: "month" | "year" };

export const Route = createFileRoute("/comecar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    plano: s["plano"] === "agency" ? "agency" : "solo",
    ciclo: s["ciclo"] === "year" ? "year" : "month",
  }),
  head: () => ({
    meta: [
      { title: "Começar teste de 14 dias — Lockcopy" },
      { name: "description", content: "Registe o cartão e comece 14 dias de teste sem cobrança." },
      { property: "og:title", content: "Começar teste de 14 dias — Lockcopy" },
      { property: "og:description", content: "Registe o cartão e comece 14 dias de teste sem cobrança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { plano, ciclo } = Route.useSearch();
  const nav = useNavigate();
  const [plan, setPlan] = useState<"solo" | "agency">(plano ?? "solo");
  const [cycle, setCycle] = useState<"month" | "year">(ciclo ?? "month");
  const [agree, setAgree] = useState(false);
  const [card, setCard] = useState("");
  const p = PLANS[plan];
  const price = cycle === "month" ? p.month : p.year;
  const first = new Date(Date.now() + 14 * 864e5).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-4xl font-bold">Comece o teste</h1>
      <p className="mt-2 text-muted-foreground">14 dias completos. Nada é cobrado durante o teste.</p>
      <div className="mt-6 space-y-4">
        <Card>
          <p className="mb-3 text-sm font-medium">Plano depois do teste</p>
          <div className="grid grid-cols-2 gap-2">
            {(["solo", "agency"] as const).map((k) => (
              <button key={k} onClick={() => setPlan(k)} className={"rounded-md border p-3 text-left " + (plan === k ? "border-primary bg-primary/5" : "border-border")}>
                <span className="font-semibold">{PLANS[k].name}</span><br />
                <span className="text-sm text-muted-foreground">${cycle === "month" ? PLANS[k].month : PLANS[k].year}/{cycle === "month" ? "mês" : "ano"}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            {(["month", "year"] as const).map((c) => (
              <label key={c} className="flex items-center gap-2"><input type="radio" checked={cycle === c} onChange={() => setCycle(c)} />{c === "month" ? "Mensal" : "Anual"}</label>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-medium">Cartão</p>
          <input className={inputClass} placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(e.target.value)} />
          <p className="mt-2 text-xs text-muted-foreground">Na versão final, este campo é o formulário seguro do Stripe.</p>
        </Card>
        <Card className="bg-muted">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Hoje</dt><dd className="text-right font-semibold">$0</dd>
            <dt className="text-muted-foreground">Primeira cobrança</dt><dd className="text-right font-semibold">{first}</dd>
            <dt className="text-muted-foreground">Valor</dt><dd className="text-right font-semibold">${price} {cycle === "month" ? "por mês" : "por ano"} + impostos</dd>
            <dt className="text-muted-foreground">Cancelar</dt><dd className="text-right">Em Faturação, a qualquer momento</dd>
          </dl>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Autorizo a cobrança automática de ${price} {cycle === "month" ? "por mês" : "por ano"} a partir de {first}, salvo se cancelar antes. Recebo um aviso antes do fim do teste.</span>
          </label>
        </Card>
        <Btn className="w-full py-3" disabled={!agree || card.replace(/\s/g, "").length < 12} onClick={() => { actions.startTrial(plan, cycle); nav({ to: "/app" }); }}>
          Registar cartão e começar
        </Btn>
        <DemoNote />
      </div>
    </div>
  );
}
