import { describe, expect, it } from "vitest";
import { canCreateRequests, planAlert } from "./trial";

const now = Date.parse("2026-11-24T12:00:00Z");
const base = { subscription_status: "trialing", trial_ends_at: null as string | null, current_period_ends_at: null as string | null, grace_period_ends_at: null as string | null };
const inDays = (d: number) => new Date(now + d * 86_400_000).toISOString();

describe("plan alert", () => {
  it("stays quiet with more than 3 trial days left", () => {
    expect(planAlert({ ...base, trial_ends_at: inDays(5) }, now).kind).toBe("ok");
  });
  it("warns in the last 3 days", () => {
    expect(planAlert({ ...base, trial_ends_at: inDays(3) }, now)).toEqual({ kind: "ending", daysLeft: 3 });
  });
  it("blocks new requests once the trial ends without a card", () => {
    const a = planAlert({ ...base, trial_ends_at: inDays(-1) }, now);
    expect(a.kind).toBe("expired");
    expect(canCreateRequests(a)).toBe(false);
  });
  it("no warning when a card was added", () => {
    expect(planAlert({ ...base, trial_ends_at: inDays(1), current_period_ends_at: inDays(1) }, now).kind).toBe("ok");
  });
});
