import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { friendlyError } from "@/lib/lockcopy";

const sql = readFileSync("db/0019_saved_templates.sql", "utf8");

describe("saved templates", () => {
  it("caps each agency at 50 saved templates", () => {
    expect(sql).toMatch(/n >= 50/);
    expect(friendlyError(new Error("template_limit"))).toBe("You can keep up to 50 saved templates. Delete one first.");
  });
  it("only lets members see their agency's templates", () => {
    expect(sql).toMatch(/org_id is null or public\.is_org_member\(org_id\)/);
  });
  it("only creates requests from the catalogue or the agency's own templates", () => {
    expect(sql).toMatch(/org_id is null or org_id = _org/);
  });
});
