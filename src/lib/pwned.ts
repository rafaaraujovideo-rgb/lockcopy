// Checks a password against HaveIBeenPwned using k-anonymity:
// only the first 5 chars of its SHA-1 hash leave the browser.
export const PWNED_MESSAGE =
  "This password has appeared in a data breach. Please choose a different one.";

export function matchesPwnedList(suffix: string, body: string): boolean {
  const s = suffix.toUpperCase();
  return body.split("\n").some((line) => {
    const [hash, count] = line.trim().split(":");
    return hash?.toUpperCase() === s && Number(count) > 0;
  });
}

export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, { headers: { "Add-Padding": "true" } });
    if (!res.ok) return false; // service down: don't block sign-up
    return matchesPwnedList(hex.slice(5), await res.text());
  } catch {
    return false;
  }
}
