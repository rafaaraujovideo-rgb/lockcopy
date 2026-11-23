import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("db/0009_trial_in_app.sql", "utf8");

describe("trial starts in the app", () => {
  it("gives every new agency 14 days on Solo without Stripe", () => {
    expect(sql).toMatch(/before insert on public\.organizations/i);
    expect(sql).toContain("new.plan := 'solo'");
    expect(sql).toContain("new.subscription_status := 'trialing'");
  });
  it("stops work when a trial without a Stripe subscription ends", () => {
    expect(sql).toMatch(/stripe_subscription_id is not null or o\.trial_ends_at is null or o\.trial_ends_at > now\(\)/);
  });
  it("does not let signed-in users change billing columns", () => {
    expect(sql).toMatch(/before update on public\.organizations/i);
    expect(sql).toContain("new.subscription_status := old.subscription_status");
  });
});
