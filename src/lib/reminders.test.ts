import { describe, it, expect } from "vitest";
import { reminderOffsetFor, reminderKind } from "./reminders";

const base = { id: "r", status: "sent", revoked_at: null, expires_at: "2030-12-31T00:00:00Z" };
const today = "2030-06-10";

describe("automatic reminders", () => {
  it("sends 3 days before the deadline", () => expect(reminderOffsetFor({ ...base, due_date: "2030-06-13" }, today)).toBe(3));
  it("sends on the deadline day", () => expect(reminderOffsetFor({ ...base, due_date: "2030-06-10" }, today)).toBe(0));
  it("sends 2 days after the deadline", () => expect(reminderOffsetFor({ ...base, due_date: "2030-06-08" }, today)).toBe(-2));
  it("skips other days", () => expect(reminderOffsetFor({ ...base, due_date: "2030-06-12" }, today)).toBeNull());
  it("skips completed, archived and revoked requests", () => {
    expect(reminderOffsetFor({ ...base, status: "completed", due_date: today }, today)).toBeNull();
    expect(reminderOffsetFor({ ...base, status: "archived", due_date: today }, today)).toBeNull();
    expect(reminderOffsetFor({ ...base, revoked_at: "2030-01-01", due_date: today }, today)).toBeNull();
  });
  it("one kind per reminder", () => expect(new Set([3, 0, -2].map(reminderKind)).size).toBe(3));
});

import { nextReminderDate as nextAt } from "./reminders";
describe("next automatic reminder", () => {
  const base = { id: "x", status: "sent", due_date: "2026-12-10", revoked_at: null, expires_at: "2027-01-30T00:00:00Z" };
  it("is 3 days before the deadline when that is still ahead", () => expect(nextAt(base, "2026-12-01")).toBe("2026-12-07"));
  it("is the deadline itself once the 3-day mark has passed", () => expect(nextAt(base, "2026-12-08")).toBe("2026-12-10"));
  it("is 2 days after the deadline after the due day", () => expect(nextAt(base, "2026-12-11")).toBe("2026-12-12"));
  it("is none once every reminder has gone out", () => expect(nextAt(base, "2026-12-13")).toBeNull());
  it("is none for completed requests", () => expect(nextAt({ ...base, status: "completed" }, "2026-12-01")).toBeNull());
});
