/**
 * Venue & time-slot clash detection.
 *
 * Two levels:
 *  • HARD  — same venue, overlapping time (including each venue's setup/teardown
 *            buffer). Publishing is blocked. Also enforced in Postgres by an
 *            exclusion constraint (prisma/sql/001_venue_clash_guard.sql).
 *  • SOFT  — a different venue but the same time window, and the events are
 *            likely to compete for the same crowd (same category, or either is
 *            a large campus-wide event). Organizer is warned, not blocked.
 *
 * The core is a pure function so it is unit-testable and can run on the client
 * for instant feedback while the organizer drags times around.
 */

export type ClashSeverity = "hard" | "soft";

export interface SlotCandidate {
  id?: string; // when editing an existing event, exclude itself
  venueId: string | null;
  startsAt: Date;
  endsAt: Date;
  category?: string;
  expectedAttendance?: number | null;
}

export interface ExistingEvent {
  id: string;
  title: string;
  venueId: string | null;
  venueName?: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  category?: string;
  capacity?: number | null;
  bufferMinutes?: number; // venue setup/teardown buffer
}

export interface Clash {
  severity: ClashSeverity;
  eventId: string;
  title: string;
  venueName?: string | null;
  startsAt: Date;
  endsAt: Date;
  overlapMinutes: number;
  reason: string;
}

export interface ClashOptions {
  /** Default buffer when an event row doesn't carry its venue's buffer. */
  defaultBufferMinutes?: number;
  /** Attendance at or above this counts as a campus-wide "big" event. */
  bigEventThreshold?: number;
}

const ACTIVE_STATUSES = new Set(["PUBLISHED", "LIVE"]);
const MIN = 60_000;

export function overlapMinutes(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  return Math.max(0, Math.round((end - start) / MIN));
}

export function detectClashes(
  candidate: SlotCandidate,
  existing: ExistingEvent[],
  opts: ClashOptions = {},
): Clash[] {
  const { defaultBufferMinutes = 30, bigEventThreshold = 300 } = opts;

  if (!(candidate.endsAt > candidate.startsAt)) {
    throw new RangeError("Event must end after it starts.");
  }

  const clashes: Clash[] = [];

  for (const ev of existing) {
    if (candidate.id && ev.id === candidate.id) continue;
    if (!ACTIVE_STATUSES.has(ev.status)) continue;

    const sameVenue = candidate.venueId !== null && ev.venueId === candidate.venueId;

    if (sameVenue) {
      const buffer = (ev.bufferMinutes ?? defaultBufferMinutes) * MIN;
      const paddedStart = new Date(ev.startsAt.getTime() - buffer);
      const paddedEnd = new Date(ev.endsAt.getTime() + buffer);
      const padded = overlapMinutes(candidate.startsAt, candidate.endsAt, paddedStart, paddedEnd);
      if (padded > 0) {
        const raw = overlapMinutes(candidate.startsAt, candidate.endsAt, ev.startsAt, ev.endsAt);
        clashes.push({
          severity: "hard",
          eventId: ev.id,
          title: ev.title,
          venueName: ev.venueName,
          startsAt: ev.startsAt,
          endsAt: ev.endsAt,
          overlapMinutes: raw > 0 ? raw : padded,
          reason:
            raw > 0
              ? `${ev.venueName ?? "This venue"} is already booked for "${ev.title}".`
              : `Too close to "${ev.title}" — ${ev.venueName ?? "the venue"} needs ${
                  buffer / MIN
                } min for setup/teardown.`,
        });
      }
      continue;
    }

    const overlap = overlapMinutes(candidate.startsAt, candidate.endsAt, ev.startsAt, ev.endsAt);
    if (overlap === 0) continue;

    const sameCategory = !!candidate.category && candidate.category === ev.category;
    const big =
      (ev.capacity ?? 0) >= bigEventThreshold ||
      (candidate.expectedAttendance ?? 0) >= bigEventThreshold;

    if (sameCategory || big) {
      clashes.push({
        severity: "soft",
        eventId: ev.id,
        title: ev.title,
        venueName: ev.venueName,
        startsAt: ev.startsAt,
        endsAt: ev.endsAt,
        overlapMinutes: overlap,
        reason: sameCategory
          ? `Overlaps a similar ${ev.category?.toLowerCase()} event — you may split the crowd.`
          : `Overlaps a large event (${ev.capacity ?? "300+"} expected).`,
      });
    }
  }

  // Hard clashes first, then by largest overlap.
  return clashes.sort((a, b) =>
    a.severity === b.severity ? b.overlapMinutes - a.overlapMinutes : a.severity === "hard" ? -1 : 1,
  );
}

export const hasHardClash = (clashes: Clash[]) => clashes.some((c) => c.severity === "hard");
