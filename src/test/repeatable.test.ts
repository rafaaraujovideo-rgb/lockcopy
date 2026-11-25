import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("db/0022_repeatable_sections.sql", "utf8");

describe("repeatable pages", () => {
  it("caps a page at 20 copies in total", () => {
    expect(sql).toMatch(/copies >= 19 then raise exception 'too_many_copies'/);
  });
  it("only removes copies that have no answers or files", () => {
    expect(sql).toMatch(/raise exception 'copy_not_empty'/);
    expect(sql).toMatch(/repeat_of is not null\) then\s+raise exception 'not_repeatable'/);
  });
});
