/** The only account allowed into the owner area. */
export const ADMIN_EMAIL = "rafaaraujo.video@gmail.com";

/** True only for the owner's email with a confirmed address. */
export function isAdminUser(user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined) {
  if (!user?.email || !user.email_confirmed_at) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL;
}
