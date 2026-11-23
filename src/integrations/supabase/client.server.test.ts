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

describe("server admin client", () => {
  it("uses the key stored as LOCKCOPY_DB_SECRET_KEY", () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    process.env["LOCKCOPY_DB_SECRET_KEY"] = "sb_secret_test";
    expect(() => createAdminSupabase()).not.toThrow();
  });

  it("still accepts the old SUPABASE_SERVICE_ROLE_KEY name", () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    delete process.env["LOCKCOPY_DB_SECRET_KEY"];
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "sb_secret_test";
    expect(() => createAdminSupabase()).not.toThrow();
  });

  it("fails without any service key", () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    delete process.env["LOCKCOPY_DB_SECRET_KEY"];
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    expect(() => createAdminSupabase()).toThrow(/LOCKCOPY_DB_SECRET_KEY/);
  });

  it("rejects the publishable key in place of the secret one", () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    process.env["LOCKCOPY_DB_SECRET_KEY"] = "sb_publishable_test";
    expect(() => createAdminSupabase()).toThrow(/sb_secret_/);
  });
});
