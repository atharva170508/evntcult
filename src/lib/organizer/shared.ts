/** Rules shared by the organizer screens and the server. No server or browser APIs. */

export const ORGANIZER_CATEGORIES = [
  ["PARTY", "Party"],
  ["CULTURAL", "Cultural"],
  ["TECH", "Tech"],
  ["GAMING", "Gaming"],
  ["SPORTS", "Sports"],
  ["WORKSHOP", "Workshop"],
  ["TALK", "Talk"],
] as const;

export const UPI_PATTERN = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/;
export const isValidUpi = (v: string) => UPI_PATTERN.test(v.trim().toLowerCase());

/** The optional event link: http or https only, so a script link can never be saved. */
export const LINK_ERROR = "Start the link with https://";
export const isValidLink = (v: string) => v.length <= 300 && /^https?:\/\/[^\s]+$/i.test(v);
export const linkLabel = (v: string) => v.replace(/^https?:\/\//i, "").replace(/\/$/, "");

/** Custom join codes: 4 to 20 letters or digits, stored upper-case. */
export const normalizeCode = (v: string) => v.trim().toUpperCase().replace(/[\s-]/g, "");
export const isValidCustomCode = (v: string) => /^[A-Z0-9]{4,20}$/.test(normalizeCode(v));

/** Lowercase, non-alphanumeric to hyphen, collapse, trim, max 60. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "event"
  );
}

export const IST = "Asia/Kolkata";
export const istDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(d);
export const istTime = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
export const istToIso = (date: string, time: string) => new Date(`${date}T${time}:00+05:30`).toISOString();

/** "SAT 07 NOV" */
export function ticketDate(iso: string): string {
  const d = new Date(iso);
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: IST, ...o }).format(d).toUpperCase();
  return `${part({ weekday: "short" })} ${part({ day: "2-digit" })} ${part({ month: "short" })}`;
}

/** "ends 20:00", or "ends 02:00 +1" when it runs past midnight. */
export function endsLabel(date: string, time: string, minutes: number): string {
  const start = new Date(istToIso(date, time));
  const end = new Date(start.getTime() + minutes * 60_000);
  const days = Math.round((Date.parse(`${istDate(end)}T00:00:00Z`) - Date.parse(`${istDate(start)}T00:00:00Z`)) / 86_400_000);
  return `ends ${istTime(end)}${days > 0 ? ` +${days}` : ""}`;
}

export type PublishField = "name" | "category" | "venue" | "description" | "payout" | "code";

export interface PublishCheck {
  title: string | null;
  category: string | null;
  venue: string | null;
  venue_status: string;
  description: string | null;
  price_paise: number;
  organizer_upi_id: string | null;
  access: string;
  access_code: string | null;
}

/** Only what an event truly can't go live without. Category, venue and About can come later. */
export function missingForPublish(e: PublishCheck): PublishField[] {
  const missing: PublishField[] = [];
  if (!e.title?.trim()) missing.push("name");
  if (e.price_paise > 0 && !e.organizer_upi_id) missing.push("payout");
  if (e.access === "code" && !e.access_code) missing.push("code");
  return missing;
}

export const MISSING_LABEL: Record<PublishField, string> = {
  name: "name",
  category: "category",
  venue: "venue",
  description: "about, 40 characters",
  payout: "payout UPI",
  code: "join code",
};

/* ------------------------------------------------------------ calendar */

export interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  venue: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  capacity: number | null;
  taken: number;
  version: number;
  clash: boolean;
}

export const dayKey = (iso: string) => istDate(new Date(iso));

/** Runs across more than one calendar day. An all-nighter ending before 06:00 still counts as one night. */
export function isMultiDay(e: Pick<CalendarEvent, "starts_at" | "ends_at">): boolean {
  const end = new Date(new Date(e.ends_at).getTime() - 6 * 3_600_000);
  return dayKey(e.starts_at) < istDate(end);
}

export const seatsLabel = (e: Pick<CalendarEvent, "capacity" | "taken">) => (e.capacity === null ? "Unlimited" : `${e.taken} / ${e.capacity}`);
export const isSoldOut = (e: Pick<CalendarEvent, "capacity" | "taken">) => e.capacity !== null && e.taken >= e.capacity;
export const isLiveNow = (e: Pick<CalendarEvent, "status" | "starts_at" | "ends_at">, now = Date.now()) => e.status === "published" && Date.parse(e.starts_at) <= now && Date.parse(e.ends_at) > now;

const lastDay = (e: Pick<CalendarEvent, "ends_at">) => new Date(Date.parse(e.ends_at) - 1).toISOString();

/** Calendar days an event touches, counted the same way as its bar on the grid. */
export function spanDays(e: Pick<CalendarEvent, "starts_at" | "ends_at">): number {
  return Math.round((Date.parse(dayKey(lastDay(e))) - Date.parse(dayKey(e.starts_at))) / 86_400_000) + 1;
}

/** "NOV 20-22", or "NOV 30-DEC 2" when it crosses a month. */
export function spanRange(e: Pick<CalendarEvent, "starts_at" | "ends_at">): string {
  const parts = (iso: string) => {
    const t = ticketDate(iso);
    return { day: Number(t.slice(4, 6)), month: t.slice(7) };
  };
  const a = parts(e.starts_at);
  const b = parts(lastDay(e));
  return a.month === b.month ? `${a.month} ${a.day}-${b.day}` : `${a.month} ${a.day}-${b.month} ${b.day}`;
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const MAX_CHIPS = 2;

export interface MonthCell {
  date: string;
  day: number;
  inMonth: boolean;
  chips: CalendarEvent[];
  /** Everything on this day, for the popover. */
  all: CalendarEvent[];
  more: number;
}

export interface MonthBar {
  event: CalendarEvent;
  startCol: number;
  span: number;
  /** A later row of a bar crossing a week boundary: drawn as a stub with no title. */
  continuation: boolean;
}

export interface MonthWeek {
  cells: MonthCell[];
  bars: MonthBar[];
}

/** Lays a month out as Monday-first weeks. Multi-day events become one bar per week, never chips. */
export function layoutMonth(year: number, month: number, events: CalendarEvent[]): MonthWeek[] {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weekCount = Math.ceil((lead + daysInMonth) / 7);
  const start = addDays(first, -lead);
  const multi = events.filter(isMultiDay);
  const single = events.filter((e) => !isMultiDay(e));
  const inMonthPrefix = first.slice(0, 7);

  const weeks: MonthWeek[] = [];
  const seenBar = new Set<string>();
  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(start, w * 7);
    const weekEnd = addDays(weekStart, 6);
    const bars: MonthBar[] = [];
    const laneTaken: boolean[] = Array(7).fill(false);
    const hiddenBars: Record<number, CalendarEvent[]> = {};

    for (const e of [...multi].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
      const s = dayKey(e.starts_at);
      const last = istDate(new Date(new Date(e.ends_at).getTime() - 1));
      if (last < weekStart || s > weekEnd) continue;
      const from = s < weekStart ? weekStart : s;
      const to = last > weekEnd ? weekEnd : last;
      const startCol = Math.round((Date.parse(from) - Date.parse(weekStart)) / 86_400_000);
      const span = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
      const covered = Array.from({ length: span }, (_, i) => startCol + i);
      if (covered.some((c) => laneTaken[c])) {
        for (const c of covered) (hiddenBars[c] ??= []).push(e);
        continue;
      }
      covered.forEach((c) => (laneTaken[c] = true));
      bars.push({ event: e, startCol, span, continuation: seenBar.has(e.id) });
      seenBar.add(e.id);
    }

    const cells: MonthCell[] = Array.from({ length: 7 }, (_, c) => {
      const date = addDays(weekStart, c);
      const inMonth = date.startsWith(inMonthPrefix);
      const onDay = inMonth ? single.filter((e) => dayKey(e.starts_at) === date).sort((a, b) => a.starts_at.localeCompare(b.starts_at)) : [];
      const hidden = inMonth ? (hiddenBars[c] ?? []) : [];
      const room = MAX_CHIPS;
      const chips = onDay.slice(0, room);
      const all = [...onDay, ...hidden, ...(inMonth ? multi.filter((e) => bars.some((b) => b.event.id === e.id && c >= b.startCol && c < b.startCol + b.span)) : [])];
      return { date, day: Number(date.slice(8)), inMonth, chips, all, more: onDay.length - chips.length + hidden.length };
    });
    weeks.push({ cells, bars });
  }
  return weeks;
}
