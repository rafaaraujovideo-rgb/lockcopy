import { describe, it, expect } from "vitest";
import { PLANS, actions } from "./store";

describe("regras de planos", () => {
  it("preços e limites", () => {
    expect(PLANS.solo).toMatchObject({ month: 19, year: 190, requests: 15, users: 1, storageGb: 5 });
    expect(PLANS.agency).toMatchObject({ month: 39, year: 390, requests: 50, users: 3, storageGb: 20 });
    expect(PLANS.teste.requests).toBe(1);
  });
  it("teste bloqueia o segundo pedido ativo", () => {
    const r = actions.createRequest({ client: "X", clientEmail: "x@x.pt", title: "T", templateId: "landing", deadline: "2030-01-01" });
    expect("error" in r).toBe(true);
  });
});
