import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, PLANS } from "@/lib/store";
import { Btn, Card, DemoNote, btnClass } from "@/components/ui-bits";

export const Route = createFileRoute("/app/faturacao")({
  head: () => ({
    meta: [
      { title: "Faturação — Brief" },
      { name: "description", content: "Plano, teste, próxima cobrança e cancelamento." },
      { property: "og:title", content: "Faturação — Brief" },
      { property: "og:description", content: "Plano, teste, próxima cobrança e cancelamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Billing,
});

function Billing() {
  const s = useStore((x) => x);
  const chosen = PLANS[s.chosen];
  const price = s.billing === "month" ? chosen.month : chosen.year;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-4xl font-bold">Faturação</h1>
      {!s.cardAdded ? (
        <Card>
          <p>Ainda não começou o teste.</p>
          <Link to="/comecar" className={btnClass + " mt-3"}>Registar cartão e começar 14 dias</Link>
        </Card>
      ) : (
        <Card className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Estado:</span> em teste até <b>{s.trialEnds}</b> — sem cobranças até lá</p>
          <p><span className="text-muted-foreground">Depois do teste:</span> {chosen.name}, ${price}/{s.billing === "month" ? "mês" : "ano"} + impostos</p>
          <p><span className="text-muted-foreground">Limites no teste:</span> {PLANS.teste.requests} pedido ativo, 500 MB</p>
          <div className="flex gap-2 pt-2">
            <Btn variant="outline" disabled>Gerir cartão</Btn>
            <Btn variant="outline" disabled>Cancelar antes da cobrança</Btn>
          </div>
          <p className="text-xs text-muted-foreground">Estes botões abrem o portal do Stripe quando a cobrança estiver ligada.</p>
        </Card>
      )}
      <Card className="text-sm text-muted-foreground">
        Falha de pagamento: 7 dias de tolerância sem bloquear pedidos em curso. Cancelamento: acesso até ao fim do período pago, com exportação disponível.
      </Card>
      <DemoNote />
    </div>
  );
}
