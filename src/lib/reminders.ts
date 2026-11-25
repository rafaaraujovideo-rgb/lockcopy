/** Automatic deadline reminders: 3 days before, on the day, 2 days after. */
export const REMINDER_OFFSETS = [3, 0, -2] as const;

export type ReminderRequest = {
  id: string;
  status: string;
  due_date: string | null;
  revoked_at: string | null;
  expires_at: string;
};

const DAY = 864e5;

/** Which reminder (days before the deadline) is due today for this request, if any. */
export function reminderOffsetFor(r: ReminderRequest, today: string): number | null {
  if (!r.due_date || r.revoked_at) return null;
  if (r.status === "archived" || r.status === "completed" || r.status === "draft") return null;
  if (new Date(r.expires_at).getTime() <= new Date(`${today}T00:00:00Z`).getTime()) return null;
  const diff = Math.round((Date.parse(`${r.due_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
  return (REMINDER_OFFSETS as readonly number[]).includes(diff) ? diff : null;
}

export function reminderKind(offset: number) {
  return `auto_reminder_${offset < 0 ? `after_${-offset}` : offset === 0 ? "due" : `before_${offset}`}`;
}

export function reminderEmail(offset: number, title: string, agency: string, missing: number, link: string) {
  const days = Math.abs(offset);
  const duration = `${days} day${days === 1 ? "" : "s"}`;
  const when = offset > 0 ? `in ${duration}` : offset === 0 ? "today" : `${duration} ago`;
  const subject = offset < 0 ? `Still waiting on content for ${title}` : `Content for ${title} is due ${when}`;
  const deadline = offset < 0 ? `was due ${when}` : `is due ${when}`;
  const body =
    `Hi,\n\nThe content for "${title}" ${deadline}. ${agency} is still waiting on ${missing} item${missing === 1 ? "" : "s"}. ` +
    `Your saved answers are still there. You can finish here:\n\n${link}\n\nThanks!`;
  return { subject, body };
}

/** Date (YYYY-MM-DD) of the next automatic reminder on or after `today`, or null if none is left. */
export function nextReminderDate(r: ReminderRequest, today: string): string | null {
  if (!r.due_date || r.revoked_at) return null;
  if (r.status === "archived" || r.status === "completed" || r.status === "draft") return null;
  const due = Date.parse(`${r.due_date}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  const expires = new Date(r.expires_at).getTime();
  for (const off of REMINDER_OFFSETS) {
    const at = due - off * DAY;
    if (at >= now && at < expires) return new Date(at).toISOString().slice(0, 10);
  }
  return null;
}
