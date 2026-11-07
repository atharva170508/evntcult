import "server-only";
import { all, first } from "@/lib/db";
import type { Viewer } from "@/lib/rbac";
import type { ListQuery } from "@/lib/validation";
import type { EventRow, EventSummary } from "./types";

const ACCENTS = ["blue", "violet", "orange", "teal", "pink", "green", "red"];
const CATEGORY_ACCENT: Record<string, string> = {
  GAMING: "red",
  SPORTS: "orange",
  TECH: "blue",
  CULTURAL: "pink",
  WORKSHOP: "teal",
  TALK: "teal",
  PARTY: "violet",
};

/** Stable poster colour per event. */
export const accentFor = (e: { id: string; category: string }) =>
  CATEGORY_ACCENT[e.category] ?? ACCENTS[[...e.id].reduce((s, c) => s + c.charCodeAt(0), 0) % ACCENTS.length];

/** Seats taken = registered + waitlisted holds (the same count the atomic insert uses). */
export const SEATS_TAKEN_SQL =
  "(SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('registered','waitlisted'))";

export type EventRowWithCount = EventRow & { taken: number };

export function toSummary(e: EventRowWithCount): EventSummary {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    tagline: e.tagline?.trim() || firstLine(e.description),
    category: e.category,
    visibility: e.access === "code" ? "CODE_ONLY" : "PUBLIC",
    status: e.status,
    startsAt: new Date(e.starts_at),
    endsAt: new Date(e.ends_at),
    venueName: e.venue,
    capacity: e.capacity,
    registered: e.taken,
    feePaise: e.price_paise,
    accent: accentFor(e),
  };
}

function firstLine(d: string | null) {
  if (!d) return null;
  const line = d.split("\n")[0].trim();
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

/* ─── List with filters + cursor pagination ─────────────────────────────── */

export const PAGE_SIZE = 12;
const IST = 5.5 * 3_600_000;

/** [from, to) UTC range for a "when" filter, computed on IST calendar days. */
function whenRange(when: NonNullable<ListQuery["when"]>, now = Date.now()): [string, string] {
  const ist = new Date(now + IST);
  const midnight = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST;
  const day = 86_400_000;
  const dow = (ist.getUTCDay() + 6) % 7; // Monday = 0
  const ranges = {
    today: [midnight, midnight + day],
    weekend: [midnight + (5 - Math.min(dow, 5)) * day, midnight + (7 - dow) * day],
    week: [midnight, midnight + 7 * day],
    month: [midnight, midnight + 31 * day],
  } as const;
  const [a, b] = ranges[when];
  return [new Date(a).toISOString(), new Date(b).toISOString()];
}

const encodeCursor = (e: { starts_at: string; id: string }) => btoa(`${e.starts_at}|${e.id}`);
function decodeCursor(c: string): [string, string] | null {
  try {
    const [s, id] = atob(c).split("|");
    return s && id ? [s, id] : null;
  } catch {
    return null;
  }
}

/** Published, public, not-yet-ended events. Private (code) events are only shown to people who unlocked them. */
export async function listEvents(q: ListQuery): Promise<{ events: EventSummary[]; nextCursor: string | null }> {
  const where = ["e.status = 'published'", "e.access = 'public'", "e.ends_at > ?"];
  const args: unknown[] = [new Date().toISOString()];
  if (q.type) {
    where.push("e.category = ?");
    args.push(q.type);
  }
  if (q.price === "free") where.push("e.price_paise = 0");
  if (q.price === "paid") where.push("e.price_paise > 0");
  if (q.when) {
    const [from, to] = whenRange(q.when);
    where.push("e.starts_at < ? AND e.ends_at > ?");
    args.push(to, from);
  }
  if (q.q) {
    where.push("(e.title LIKE ? ESCAPE '\\' OR e.venue LIKE ? ESCAPE '\\' OR e.description LIKE ? ESCAPE '\\')");
    const like = `%${q.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    args.push(like, like, like);
  }
  const cur = q.cursor ? decodeCursor(q.cursor) : null;
  if (cur) {
    where.push("(e.starts_at > ? OR (e.starts_at = ? AND e.id > ?))");
    args.push(cur[0], cur[0], cur[1]);
  }

  const rows = await all<EventRowWithCount>(
    `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${where.join(" AND ")}
      ORDER BY e.starts_at ASC, e.id ASC LIMIT ?`,
    ...args,
    PAGE_SIZE + 1,
  );
  const page = rows.slice(0, PAGE_SIZE);
  return { events: page.map(toSummary), nextCursor: rows.length > PAGE_SIZE ? encodeCursor(page[page.length - 1]) : null };
}

/* ─── Detail ───────────────────────────────────────────────────────────── */

export interface MyRegistration {
  id: string;
  status: "registered" | "waitlisted" | "cancelled";
  pass_code: string;
  pass_token: string;
  payment_status: "paid" | "unpaid";
  hold_expires_at: string | null;
  checked_in_at: string | null;
}

export interface EventDetail {
  event: EventRowWithCount;
  seatsLeft: number;
  myRegistration: MyRegistration | null;
  isOwner: boolean;
}

/** By id or slug. Drafts are visible to their owner only; code events need the code, a registration, or ownership. */
export async function getEventDetail(ref: string, viewer: Viewer | null, code?: string | null): Promise<EventDetail | null> {
  const event = await first<EventRowWithCount>(
    `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE e.slug = ? OR e.id = ?`,
    ref,
    ref,
  );
  if (!event) return null;
  const isOwner = !!viewer && (viewer.role === "admin" || event.organizer_id === viewer.id);

  const myRegistration = viewer
    ? await first<MyRegistration>(
        `SELECT r.id, r.status, r.pass_code, r.pass_token, r.payment_status, r.hold_expires_at,
                (SELECT c.scanned_at FROM checkins c WHERE c.registration_id = r.id) AS checked_in_at
           FROM registrations r WHERE r.event_id = ? AND r.user_id = ?`,
        event.id,
        viewer.id,
      )
    : null;

  if (event.status === "draft" && !isOwner) return null;
  if (event.access === "code" && !isOwner && !myRegistration) {
    const ok = !!code && !!event.access_code && code.trim().toUpperCase() === event.access_code;
    if (!ok) return null;
  }

  // Online events: the join link is only for the organizer and people holding a pass.
  // Strip it here so it can't leak into any page or client component for everyone else.
  if (!isOwner && myRegistration?.status !== "registered") event.meeting_url = null;
  return { event, seatsLeft: Math.max(0, event.capacity - event.taken), myRegistration, isOwner };
}
