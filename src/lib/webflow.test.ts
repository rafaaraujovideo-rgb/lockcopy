import { describe, expect, it } from "vitest";
import { buildWebflowItems } from "./webflow";

const exp = {
  title: "Site", client: "Acme",
  sections: [{ id: "s1", title: "Home", fields: [
    { id: "f1", label: "Headline", field_type: "short_text" },
    { id: "f2", label: "About", field_type: "long_text" },
    { id: "f3", label: "Hero image", field_type: "file" },
  ] }],
  text: { f1: "Hi", f2: "A\n\nB" }, files: [],
};
const wf = [
  { slug: "name", displayName: "Name", type: "PlainText" },
  { slug: "headline", displayName: "Headline", type: "PlainText" },
  { slug: "about", displayName: "About", type: "RichText" },
  { slug: "hero-image", displayName: "Hero image", type: "Image" },
];

describe("buildWebflowItems", () => {
  it("sends only approved answers", () => {
    const [i] = buildWebflowItems(exp, wf, new Set(["f1"]));
    expect(i?.fieldData).toEqual({ name: "Home", slug: "acme-home", headline: "Hi" });
  });
  it("maps rich text and images", () => {
    const [i] = buildWebflowItems(exp, wf, new Set(["f2", "f3"]), { f3: ["https://x/y.webp"] });
    expect(i?.fieldData["about"]).toBe("<p>A</p><p>B</p>");
    expect(i?.fieldData["hero-image"]).toEqual({ url: "https://x/y.webp" });
  });
});
