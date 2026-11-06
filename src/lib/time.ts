/** All timestamps are stored as ISO 8601 UTC strings and rendered in Asia/Kolkata. */

export const TZ = "Asia/Kolkata";

export const nowIso = () => new Date().toISOString();

/** Parse a stored timestamp. Throws if it is not a valid UTC ISO string. */
export function parseUtc(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/.test(iso)) throw new Error(`Not a UTC ISO timestamp: ${iso}`);
  return new Date(iso);
}

/** "2026-11-14" + "10:00" entered in IST → UTC ISO string. */
export function istToUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

/** yyyy-mm-dd of a Date, in IST. */
export const istYmd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

/** "HH:MM" of a Date, in IST (24-hour). */
export const istHm = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
