import { describe, expect, it } from "vitest";
import { zipTextEntries } from "./exports";

describe("ZIP text export", () => {
  it("writes one copy.txt per page with the client's answers", () => {
    const out = zipTextEntries({
      title: "Site", client: "Lua",
      sections: [{ id: "s1", title: "Home", fields: [{ id: "f1", label: "Headline", field_type: "text" }] }, { id: "s2", title: "About", fields: [{ id: "f2", label: "Story", field_type: "textarea" }] }],
      text: { f1: "Fresh bread" }, files: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.zipPath).toBe("home/copy.txt");
    expect(out[0]?.content).toContain("Fresh bread");
  });
});
