import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const DB_DIR = resolve(process.cwd(), "db");

const files = readdirSync(DB_DIR)
  .filter((f) => /^\d{4}_.*\.sql$/.test(f))
  .sort();

const sql = files.map((f) => readFileSync(resolve(DB_DIR, f), "utf8")).join("\n");

function tableNames(source: string) {
  const names = new Set<string>();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) names.add(m[1]!);
  return [...names];
}

function grantStatements(source: string) {
  return source
    .split(/;\s*/g)
    .filter((chunk) => /^\s*grant\s/i.test(chunk));
}

describe("db/*.sql", () => {
  it("applies the files in the expected order", () => {
    expect(files).toEqual([
      "0001_schema.sql",
      "0002_functions.sql",
      "0003_rls.sql",
      "0004_portal.sql",
      "0005_storage_policies.sql",
      "0006_seed_templates.sql",
      "0007_webp.sql",
      "0008_english.sql",
      "0009_trial_in_app.sql",
      "0010_team_invites.sql",
      "0011_logo_and_file_removal.sql",
      "0012_client_questions.sql",
    "0013_tighten_policies.sql",
    "0014_security_fixes.sql",
    "0015_private_limit_helpers.sql",
    "0016_private_enqueue_notification.sql",
    "0017_feedback.sql",
    "0018_natural_email_copy.sql",
      "0019_saved_templates.sql",
      "0020_auto_reminders_cron.sql",
      "0021_reminders_unopened.sql",
    ]);
  });

  it("grants access for each table created in public", () => {
    const grants = grantStatements(sql).join("\n");
    const missing = tableNames(sql).filter(
      (t) => !new RegExp(`\\bpublic\\.${t}\\b`, "i").test(grants),
    );
    expect(missing).toEqual([]);
  });

  it("enables RLS on every public table", () => {
    const missing = tableNames(sql).filter(
      (t) =>
        !new RegExp(`alter\\s+table\\s+public\\.${t}\\s+enable\\s+row\\s+level\\s+security`, "i").test(
          sql,
        ),
    );
    expect(missing).toEqual([]);
  });

  it("does not write to storage.buckets", () => {
    expect(/insert\s+into\s+storage\.buckets/i.test(sql)).toBe(false);
    expect(/update\s+storage\.buckets/i.test(sql)).toBe(false);
  });

  it("keeps the business plan limits", () => {
    const solo = /'solo',\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+),\s*([\d.]+)/i.exec(sql);
    const agency = /'agency',\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+),\s*([\d.]+)/i.exec(sql);
    const trial = /'teste',\s*(\d+),\s*(\d+),\s*(\d+)/i.exec(sql);

    expect(trial?.[1]).toBe("1");
    expect(Number(trial?.[3])).toBe(500 * 1024 * 1024);
    expect(solo?.[1]).toBe("15");
    expect(Number(solo?.[3])).toBe(5 * 1024 * 1024 * 1024);
    expect(solo?.[4]).toBe("19.00");
    expect(agency?.[1]).toBe("50");
    expect(Number(agency?.[3])).toBe(20 * 1024 * 1024 * 1024);
    expect(agency?.[5]).toBe("390.00");
  });

  it("creates the 4 templates with their sections and fields", () => {
    expect(sql).toContain("'institucional'");
    expect(sql).toContain("'landing'");
    expect(sql).toContain("'ecommerce'");
    expect(sql).toContain("'rebranding'");
    const seed = readFileSync(resolve(DB_DIR, "0006_seed_templates.sql"), "utf8");
    const sections = (seed.match(/insert into public\.template_sections/gi) ?? []).length;
    const fields = (seed.match(/insert into public\.template_fields/gi) ?? []).length;
    expect(sections).toBe(1);
    expect(fields).toBe(1);
    expect((sql.match(/0000000001\d\d/g) ?? []).length).toBeGreaterThanOrEqual(9);
  });
});
