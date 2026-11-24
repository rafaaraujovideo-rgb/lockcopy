import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const SENDER = "notify@lockcopy.com";

describe("Transactional email sender", () => {
  it("sends reminders and notices from the verified Brevo sender", () => {
    const cron = readFileSync("src/routes/api/public/cron/notifications.ts", "utf8");
    expect(cron).toContain(`Lockcopy <${SENDER}>`);
    expect(cron).not.toContain("hello@lockcopy.com");
    expect(cron).not.toContain("gmail.com");
  });

  it("sends team invites from the same sender", () => {
    const team = readFileSync("src/lib/team.functions.ts", "utf8");
    expect(team).toContain(`Lockcopy <${SENDER}>`);
    expect(team).not.toContain("hello@lockcopy.com");
    expect(team).not.toContain("gmail.com");
  });

  it("documents the sender in the env template", () => {
    const example = readFileSync(".env.example", "utf8");
    expect(example).toContain(`EMAIL_FROM=Lockcopy <${SENDER}>`);
    expect(example).not.toContain("notificacoes@lockcopy.com");
  });
});
