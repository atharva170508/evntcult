import { cookies } from "next/headers";
import { all, first, getDB } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { newId } from "@/lib/tokens";

/**
 * Volunteer gate links. The organizer creates a link for one event; whoever opens it gets a
 * cookie that lets them use that event's scanner (and, if allowed, hand out merch and meals)
 * until the link expires or is revoked. Nothing else: no revenue, no settings, no guest list UI.
 */

export const VOLUNTEER_COOKIE = "ec_vol";
export type VolunteerRole = "gate" | "gate_merch";

export interface VolunteerLink {
  id: string;
  label: string;
  role: VolunteerRole;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  scans: number;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createVolunteerLink(input: { eventId: string; label: string; role: VolunteerRole; expiresAt: Date; createdBy: string }) {
  const token = newToken();
  const id = newId();
  const db = await getDB();
  await db
    .prepare("INSERT INTO volunteer_links (id, event_id, token_hash, label, role, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, input.eventId, await sha256(token), input.label, input.role, input.createdBy, new Date().toISOString(), input.expiresAt.toISOString())
    .run();
  return { id, token };
}

export function listVolunteerLinks(eventId: string) {
  return all<VolunteerLink>(
    "SELECT id, label, role, created_at, expires_at, revoked_at, last_used_at, scans FROM volunteer_links WHERE event_id = ? ORDER BY created_at DESC",
    eventId,
  );
}

export async function revokeVolunteerLink(eventId: string, id: string) {
  const db = await getDB();
  await db.prepare("UPDATE volunteer_links SET revoked_at = ? WHERE id = ? AND event_id = ? AND revoked_at IS NULL").bind(new Date().toISOString(), id, eventId).run();
}

/** A live link for this token (any event), or null. */
export async function linkForToken(token: string) {
  if (!token || token.length < 20 || token.length > 64) return null;
  return first<VolunteerLink & { event_id: string }>(
    "SELECT id, event_id, label, role, created_at, expires_at, revoked_at, last_used_at, scans FROM volunteer_links WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?",
    await sha256(token),
    new Date().toISOString(),
  );
}

/** The volunteer link this browser holds for an event, if it's still live. */
export async function volunteerForEvent(eventId: string) {
  const token = (await cookies()).get(VOLUNTEER_COOKIE)?.value;
  if (!token) return null;
  const link = await linkForToken(token);
  return link && link.event_id === eventId ? link : null;
}

export interface GateActor {
  /** Recorded in the audit log: the organizer's user id, or "vol:<link id>". */
  actorId: string;
  volunteer: { id: string; label: string; role: VolunteerRole } | null;
}

/**
 * Who may use the gate for this event: its organizer (or an admin), or a volunteer holding a
 * live link for it. Merch and meal hand-outs need a gate_merch link.
 */
export async function requireGateAccess(eventId: string, opts: { merch?: boolean } = {}): Promise<GateActor> {
  const viewer = await getViewer();
  if (viewer && (await canManageEvent(viewer, eventId))) return { actorId: viewer.id, volunteer: null };

  const link = await volunteerForEvent(eventId);
  if (!link) {
    if (!viewer) throw new ApiError(401, "unauthenticated", "Sign in, or open the volunteer link again.");
    throw new ApiError(403, "forbidden", "Only this event's organizer or its volunteers can scan.");
  }
  if (opts.merch && link.role !== "gate_merch") throw new ApiError(403, "forbidden", "This volunteer link is for entry only.");
  return { actorId: `vol:${link.id}`, volunteer: { id: link.id, label: link.label, role: link.role } };
}

/** Best-effort usage stats on the link (last used, scan count). */
export async function touchVolunteer(linkId: string, scanned: boolean) {
  const db = await getDB();
  await db
    .prepare(`UPDATE volunteer_links SET last_used_at = ?${scanned ? ", scans = scans + 1" : ""} WHERE id = ?`)
    .bind(new Date().toISOString(), linkId)
    .run();
}
