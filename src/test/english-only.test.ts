import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { friendlyError } from "@/lib/lockcopy";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|css)$/.test(n) && !n.includes("routeTree.gen") ? [p] : [];
  });
}

describe("English-only product", () => {
  it("has no Portuguese route paths", () => {
    const routes = files("src/routes").map((f) => f.replace(/\\/g, "/"));
    for (const pt of ["entrar", "comecar", "modelos", "comparar", "privacidade", "termos", "nova-password", "pedidos", "faturacao", "novo"]) {
      expect(routes.some((r) => r.includes(pt))).toBe(false);
    }
  });
  it("has no Portuguese diacritics in source", () => {
    const hits = files("src").filter((f) => !f.endsWith("english-only.test.ts") && !f.endsWith("lockcopy.test.ts") && /[ãõâêô]|ção|ções/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
  it("shows database limit errors in English", () => {
    expect(friendlyError(new Error("limite_pedidos — atingiu o limite de 3 pedidos ativos."))).toBe("You've reached your plan's limit of active requests. Requests already open keep receiving content.");
    expect(friendlyError(new Error("campo_trancado — este campo já foi aprovado pela agência."))).toBe("This field was already approved by the agency.");
  });
});
