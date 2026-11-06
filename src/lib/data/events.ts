import "server-only";
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

/** Seats taken = registered + waitlisted holds (matches the atomic insert's count). */
export const SEATS_TAKEN_SQL = "(SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('registered','waitlisted'))";

export type EventRowWithCount = EventRow & { taken: number };

export function toSummary(e: EventRowWithCount): EventSummary {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    tagline: firstLine(e.description),
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

/** The first sentence/line of the description, used as the card tagline. */
function firstLine(d: string | null) {
  if (!d) return null;
  const line = d.split("\n")[0].trim();
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}
