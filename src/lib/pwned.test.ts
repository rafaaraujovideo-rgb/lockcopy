import { describe, it, expect } from "vitest";
import { matchesPwnedList } from "./pwned";

describe("leaked password check", () => {
  it("rejects a password whose hash suffix is in the breach list", () => {
    expect(matchesPwnedList("abc123", "ABC123:42\r\nDEF456:1")).toBe(true);
  });
  it("ignores padding entries with zero count", () => {
    expect(matchesPwnedList("ABC123", "ABC123:0")).toBe(false);
  });
  it("accepts a password not in the list", () => {
    expect(matchesPwnedList("FFF999", "ABC123:42")).toBe(false);
  });
});
