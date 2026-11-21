import { afterEach, describe, expect, it } from "vitest";

import { createAdminSupabase } from "./client.server";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LOCKCOPY_DB_SECRET_KEY",
] as const;

const original: Record<string, string | undefined> = {};
for (const k of KEYS) original[k] = process.env[k];

afterEach(() => {
  for (const k of KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

describe("cliente privilegiado do servidor", () => {
  it("usa a chave guardada como LOCKCOPY_DB_SECRET_KEY", () => {
    process.env.SUPABASE_URL = "https://exemplo.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.LOCKCOPY_DB_SECRET_KEY = "sb_secret_teste";
    expect(() => createAdminSupabase()).not.toThrow();
  });

  it("continua a aceitar o nome antigo SUPABASE_SERVICE_ROLE_KEY", () => {
    process.env.SUPABASE_URL = "https://exemplo.supabase.co";
    delete process.env.LOCKCOPY_DB_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_teste";
    expect(() => createAdminSupabase()).not.toThrow();
  });

  it("falha sem nenhuma chave de serviço", () => {
    process.env.SUPABASE_URL = "https://exemplo.supabase.co";
    delete process.env.LOCKCOPY_DB_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createAdminSupabase()).toThrow(/LOCKCOPY_DB_SECRET_KEY/);
  });
});
