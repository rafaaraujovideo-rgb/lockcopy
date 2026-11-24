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
