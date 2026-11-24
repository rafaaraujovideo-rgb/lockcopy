/** Mirrors db org_can_work so the UI warns before the database blocks new requests. */
export type PlanAlert =
  | { kind: "ok" }
  | { kind: "ending"; daysLeft: number }
  | { kind: "expired" }
  | { kind: "past_due" }
  | { kind: "blocked" };

type OrgLike = {
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  grace_period_ends_at: string | null;
};

const DAY = 86_400_000;

export function planAlert(org: OrgLike | null | undefined, now = Date.now()): PlanAlert {
  if (!org) return { kind: "ok" };
  const s = org.subscription_status;
  if (s === "active") return { kind: "ok" };
  if (s === "trialing") {
    if (org.current_period_ends_at || !org.trial_ends_at) return { kind: "ok" };
    const left = new Date(org.trial_ends_at).getTime() - now;
    if (left <= 0) return { kind: "expired" };
    const daysLeft = Math.ceil(left / DAY);
    return daysLeft <= 3 ? { kind: "ending", daysLeft } : { kind: "ok" };
  }
  if (s === "past_due" && org.grace_period_ends_at && new Date(org.grace_period_ends_at).getTime() > now) return { kind: "past_due" };
  return { kind: "blocked" };
}

export const canCreateRequests = (a: PlanAlert) => a.kind === "ok" || a.kind === "ending" || a.kind === "past_due";

export function alertText(a: PlanAlert): string {
  switch (a.kind) {
    case "ending": return a.daysLeft === 1 ? "Your trial ends tomorrow." : `Your trial ends in ${a.daysLeft} days.`;
    case "expired": return "Your trial has ended. Open requests keep receiving content.";
    case "past_due": return "Your last payment failed. Update your card to keep creating requests.";
    case "blocked": return "Your plan is inactive. Open requests keep receiving content.";
    default: return "";
  }
}
