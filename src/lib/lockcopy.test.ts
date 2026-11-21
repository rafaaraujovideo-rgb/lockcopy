import { describe, expect, it } from "vitest";

import { answerLabel, orgSlug, requestLinkState, uploadProblem } from "./lockcopy";
import { zipEntries } from "./exports";

const now = new Date("2026-11-21T12:00:00Z");

describe("estado do link do cliente", () => {
  it("link desligado mostra revogado", () => {
    expect(requestLinkState({ revoked_at: "2026-11-20T00:00:00Z", expires_at: "2027-01-01T00:00:00Z" }, now)).toBe("revogado");
  });
  it("link passado o prazo mostra expirado", () => {
    expect(requestLinkState({ revoked_at: null, expires_at: "2026-11-21T11:59:59Z" }, now)).toBe("expirado");
  });
  it("link dentro do prazo e ligado mostra ativo", () => {
    expect(requestLinkState({ revoked_at: null, expires_at: "2026-12-21T00:00:00Z" }, now)).toBe("ativo");
  });
});

describe("estado das respostas", () => {
  it("resposta devolvida pela agência aparece como ajuste", () => {
    expect(answerLabel("rejected")).toBe("ajuste");
  });
  it("campo sem resposta aparece vazio", () => {
    expect(answerLabel(undefined)).toBe("vazio");
  });
});

describe("limite de upload de 50 MB", () => {
  it("aceita ficheiro com exatamente 50 MB", () => {
    expect(uploadProblem({ name: "a.jpg", size: 50 * 1024 * 1024, type: "image/jpeg" })).toBeNull();
  });
  it("recusa ficheiro acima de 50 MB", () => {
    expect(uploadProblem({ name: "a.jpg", size: 50 * 1024 * 1024 + 1, type: "image/jpeg" })).toMatch(/50 MB/);
  });
  it("recusa tipo não aceite", () => {
    expect(uploadProblem({ name: "a.exe", size: 10, type: "application/x-msdownload" })).toMatch(/não aceite/);
  });
});

describe("endereço da agência", () => {
  it("gera um slug aceite pela base de dados mesmo com acentos", () => {
    expect(orgSlug("Estúdio Ção & Filhos", "ab12")).toMatch(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/);
  });
});

describe("ZIP por página", () => {
  it("organiza original e WebP por página e campo, sem nomes repetidos", () => {
    const entries = zipEntries({
      title: "Site",
      client: "Cliente",
      sections: [{ id: "s", title: "Início", fields: [{ id: "f", label: "Fotografia de capa", field_type: "image" }] }],
      text: {},
      files: [
        { field_id: "f", file_name: "capa.jpg", storage_path: "o/t/f/1", webp_storage_path: "o/t/f/1.webp" },
        { field_id: "f", file_name: "capa.jpg", storage_path: "o/t/f/2", webp_storage_path: null },
      ],
    }).map((e) => e.zipPath);
    expect(entries).toEqual([
      "inicio/fotografia-de-capa/original/capa.jpg",
      "inicio/fotografia-de-capa/webp/capa.webp",
      "inicio/fotografia-de-capa/original/capa-2.jpg",
    ]);
  });
});
