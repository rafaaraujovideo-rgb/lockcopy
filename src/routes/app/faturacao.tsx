import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { openBillingPortal } from "@/lib/billing.functions";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate, friendlyError } from "@/lib/lockcopy";
import { Btn, btnClass, Card } from "@/components/ui-bits";

export const Route = createFileRoute("/app/faturacao")({
  head: () => ({
    meta: [
      { title: "Faturação — Lockcopy" },
      { name: "description", content: "Plano, teste, próxima cobrança e cancelamento." },
      { property: "og:title", content: "Faturação — Lockcopy" },
      { property: "og:description", content: "Plano, teste, próxima cobrança e cancelamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Billing,
});

const STATUS: Record<string, string> = {
  trialing: "em teste",
  active: "ativo",
  past_due: "pagamento em falta (7 dias de tolerância)",
  canceled: "cancelado",
  incomplete: "por concluir",
};
const PLAN_NAME: Record<string, string> = { teste: "Teste", solo: "Solo", agency: "Agency" };

function Billing() {
  const ws = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const org = ws.data?.org;
  const limits = ws.data?.limits;
  if (!org) return null;
  const hasCard = !!org.trial_ends_at || org.plan !== "teste";

  const manage = async () => {
    setBusy(true);
    setError("");
    try {
      const { url } = await openBillingPortal();
      window.location.assign(url);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-4xl font-bold">Faturação</h1>
      <Card className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Plano:</span> <b>{PLAN_NAME[org.plan]}</b> · {STATUS[org.subscription_status] ?? org.subscription_status}</p>
        {org.trial_ends_at && <p><span className="text-muted-foreground">Teste até:</span> <b>{fmtDate(org.trial_ends_at)}</b> — sem cobranças até lá</p>}
        {org.current_period_ends_at && <p><span className="text-muted-foreground">Próxima renovação:</span> {fmtDate(org.current_period_ends_at)}</p>}
        {limits && (
          <p><span className="text-muted-foreground">Limites:</span> {limits.requests_limit} pedidos ativos · {limits.users_limit} utilizador(es) · {Math.round(limits.storage_bytes / 1e9)} GB</p>
        )}
        <p><span className="text-muted-foreground">Espaço usado:</span> {(org.storage_used_bytes / 1e6).toFixed(0)} MB</p>
      </Card>
      {!hasCard ? (
        <Card>
          <p className="text-sm">Ainda não registou o cartão. O teste de 14 dias começa quando o fizer.</p>
          <Link to="/comecar" className={btnClass + " mt-3"}>Registar cartão e começar 14 dias</Link>
        </Card>
      ) : (
        <Card className="space-y-2">
          <Btn variant="outline" disabled={busy} onClick={manage}>{busy ? "A abrir…" : "Gerir cartão, faturas ou cancelar"}</Btn>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Card>
      )}
      <Card className="text-sm text-muted-foreground">
        Falha de pagamento: 7 dias de tolerância sem bloquear pedidos em curso. Cancelamento: acesso até ao fim do período pago, com exportação disponível.
      </Card>
    </div>
  );
}
