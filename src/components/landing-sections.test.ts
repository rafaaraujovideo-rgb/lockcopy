import { describe, expect, it } from "vitest";
import { savingsEstimate } from "./landing-sections";
describe("savingsEstimate", () => {
  it("multiplies sites by hours and rate", () => {
    expect(savingsEstimate(4, 3, 50)).toEqual({ hours: 12, value: 600 });
  });
});
