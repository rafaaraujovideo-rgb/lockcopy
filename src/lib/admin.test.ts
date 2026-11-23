import { describe, expect, it } from "vitest";
import { isAdminUser } from "./admin";

describe("owner area access", () => {
  it("allows rafaaraujo.video@gmail.com when confirmed", () => {
    expect(isAdminUser({ email: "rafaaraujo.video@gmail.com", email_confirmed_at: "2026-01-01" })).toBe(true);
  });
  it("blocks any other email", () => {
    expect(isAdminUser({ email: "someone@gmail.com", email_confirmed_at: "2026-01-01" })).toBe(false);
  });
  it("blocks the owner email when not confirmed", () => {
    expect(isAdminUser({ email: "rafaaraujo.video@gmail.com", email_confirmed_at: null })).toBe(false);
  });
});
