import { describe, expect, it } from "vitest";
import { renderErrorPage } from "@/lib/error-page";

describe("emergency error page", () => {
  const html = renderErrorPage();

  it("uses the Lockcopy palette, not generic greys", () => {
    expect(html).toContain("oklch(0.982 0.005 85)"); // marfim
    expect(html).toContain("oklch(0.24 0.035 260)"); // azul-tinta
    expect(html).toContain("oklch(0.52 0.085 155)"); // verde-sálvia
    expect(html).not.toMatch(/#fafafa|#111\b|#d1d5db|#4b5563/);
  });

  it("carries the brand mark, name and typefaces", () => {
    expect(html).toContain("<svg");
    expect(html).toContain("Lockcopy");
    expect(html).toContain("Plus+Jakarta+Sans");
    expect(html).toContain("JetBrains+Mono");
  });

  it("stays reachable and out of search results", () => {
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('href="/"');
    expect(html).toContain("location.reload()");
    expect(html).toContain("prefers-reduced-motion");
  });
});
