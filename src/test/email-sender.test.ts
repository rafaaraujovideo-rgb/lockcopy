import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const SENDER = "notify@lockcopy.com";

describe("Transactional email sender", () => {
  it("sends reminders and notices from the verified Brevo sender", () => {
    const cron = readFileSync("src/lib/notify-flush.server.ts", "utf8");
    expect(cron).toContain(`const DEFAULT_SENDER = "${SENDER}";`);
    expect(cron).toContain("Lockcopy <${DEFAULT_SENDER}>");
    expect(cron).not.toContain("hello@lockcopy.com");
    expect(cron).not.toContain("gmail.com");
  });

  it("emails the agency immediately when the client sends content", () => {
    const api = readFileSync("src/lib/api.functions.ts", "utf8");
    const i = api.indexOf("portal_send_to_agency");
    expect(api.slice(i, i + 800)).toContain("flushNotifications");
  });

  it("sends queued emails without waiting for an external scheduler", () => {
    const api = readFileSync("src/lib/api.functions.ts", "utf8");
    expect(api).toContain("async function flushPendingEmails()");
    // A failed email must never break the page.
    const helper = api.slice(api.indexOf("async function flushPendingEmails"), api.indexOf("async function flushPendingEmails") + 600);
    expect(helper).toContain("catch");
    // Opening the app, reviewing a field and pressing remind all flush the queue.
    for (const fn of ["export const getWorkspace", "export const reviewField", "export const sendReminder"]) {
      const at = api.indexOf(fn);
      expect(at, fn).toBeGreaterThan(-1);
      expect(api.slice(at, at + 1200), fn).toContain("flushPendingEmails()");
    }
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
