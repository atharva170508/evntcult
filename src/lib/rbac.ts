import "server-only";
import { cookies } from "next/headers";
import { first } from "@/lib/db";
import { readSessionValue, SESSION_COOKIE } from "@/lib/session";
import { ApiError } from "@/lib/api";

export type Role = "attendee" | "organizer" | "admin";

export interface Viewer {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  /** Organizer or admin (role is re-read from the DB on every request). */
  verifiedOrganizer: boolean;
}

/** The signed-in viewer, or null. The role always comes from the database, never the cookie. */
export async function getViewer(): Promise<Viewer | null> {
  const uid = await readSessionValue((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const u = await first<{ id: string; name: string; email: string; role: Role }>(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    uid,
  );
  if (!u) return null;
  return { ...u, image: null, verifiedOrganizer: u.role === "organizer" || u.role === "admin" };
}

export async function requireUser(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) throw new ApiError(401, "unauthenticated", "Sign in first.");
  return v;
}

export async function requireOrganizer(): Promise<Viewer> {
  const v = await requireUser();
  if (!v.verifiedOrganizer) throw new ApiError(403, "forbidden", "Only organizers can do this.");
  return v;
}

/** Organizers manage only their own events; admins manage all. */
export async function canManageEvent(viewer: Viewer, eventId: string): Promise<boolean> {
  if (viewer.role === "admin") return true;
  if (viewer.role !== "organizer") return false;
  const row = await first<{ organizer_id: string }>("SELECT organizer_id FROM events WHERE id = ?", eventId);
  return row?.organizer_id === viewer.id;
}

export async function requireEventOwner(eventId: string): Promise<Viewer> {
  const v = await requireOrganizer();
  if (!(await canManageEvent(v, eventId))) throw new ApiError(403, "forbidden", "You can only manage your own events.");
  return v;
}
