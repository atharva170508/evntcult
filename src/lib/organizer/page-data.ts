import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { first, getDB } from "@/lib/db";
import { canManageEvent, getViewer } from "@/lib/rbac";
import type { EditorInitial } from "@/components/organizer-ui/EventEditor";
import type { EventRow } from "@/lib/data/types";
import { istDate, istTime } from "./shared";

export async function siteHost(): Promise<string> {
  return (await headers()).get("host") ?? "evntcult.caliper.workers.dev";
}

/** The event, if the viewer may manage it. Anything else is a plain 404. */
export async function ownedRow(id: string) {
  const viewer = await getViewer();
  if (!viewer || !(await canManageEvent(viewer, id))) notFound();
  const db = await getDB();
  const row = await first<EventRow & { taken: number }>(
    `SELECT events.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id AND r.status IN ('registered','waitlisted')) AS taken FROM events WHERE id = ?`,
    id,
  );
  if (!row) notFound();
  return { viewer, db, row };
}

export function toEditorInitial(e: EventRow & { taken: number }): EditorInitial {
  const start = new Date(e.starts_at);
  return {
    id: e.id,
    slug: e.slug,
    version: e.version,
    status: e.status,
    title: e.title,
    tagline: e.tagline ?? "",
    description: e.description ?? "",
    category: e.category,
    venue: e.venue ?? "",
    venueStatus: e.venue_status,
    date: istDate(start),
    time: istTime(start),
    durationMinutes: Math.round((Date.parse(e.ends_at) - start.getTime()) / 60_000),
    capacity: e.capacity === null ? "" : String(e.capacity),
    priceRupees: e.price_paise ? String(e.price_paise / 100) : "0",
    payoutUpi: e.organizer_upi_id ?? "",
    access: e.access,
    accessCode: e.access_code?.toLowerCase() ?? "",
    taken: e.taken,
  };
}
