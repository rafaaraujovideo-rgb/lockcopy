import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { startCheckout } from "@/lib/billing.functions";
import { PLANS } from "@/lib/store";
import { useSession } from "@/lib/session";
import { useWorkspace } from "@/lib/workspace";
import { friendlyError } from "@/lib/lockcopy";
import { Btn, btnClass, Card } from "@/components/ui-bits";

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
  const { ready, session } = useSession();
  const ws = useWorkspace();
  const [plan, setPlan] = useState<"solo" | "agency">(plano ?? "solo");
  const [cycle, setCycle] = useState<"month" | "year">(ciclo ?? "month");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const p = PLANS[plan];
  const price = cycle === "month" ? p.month : p.year;
  const first = new Date(Date.now() + 14 * 864e5).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  const here = `/comecar?plano=${plan}&ciclo=${cycle}`;

  const go = async () => {
    setBusy(true);
    setError("");
    try {
      const { url } = await startCheckout({ data: { plan, cycle } });
      window.location.assign(url);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2 text-base font-semibold tracking-tight"><span className="h-2 w-2 rounded-full bg-seal" />Lockcopy</Link>
      <h1 className="font-display text-4xl font-bold">Comece o teste</h1>
      <p className="mt-2 text-muted-foreground">14 dias completos. O teste só começa depois de registar o cartão, e nada é cobrado durante o teste.</p>
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
        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {!ready ? null : !session ? (
          <Link to="/entrar" search={{ modo: "criar", seguir: here }} className={btnClass + " w-full py-3"}>Criar conta para continuar</Link>
        ) : !ws.data && !ws.isLoading ? (
          <Link to="/app" className={btnClass + " w-full py-3"}>Criar primeiro a conta da agência</Link>
        ) : (
          <Btn className="w-full py-3" disabled={!agree || busy || ws.isLoading} onClick={go}>{busy ? "A abrir o pagamento seguro…" : "Registar cartão e começar"}</Btn>
        )}
        <p className="text-center text-xs text-muted-foreground">O cartão é pedido na página segura do Stripe. Os dados do cartão nunca passam pela Lockcopy.</p>
      </div>
    </div>
  );
}
