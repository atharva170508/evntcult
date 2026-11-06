import "server-only";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/env";
import { DEMO_ORGANIZER, DEMO_STUDENT } from "@/lib/data/mock";

export interface Viewer {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  /** True only when the organizer profile is VERIFIED (re-checked server-side). */
  verifiedOrganizer: boolean;
}

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

export const DEMO_PERSONA_COOKIE = "evnt_demo_as";

/**
 * The signed-in viewer, or null. In DEMO_MODE returns a mock viewer whose
 * persona (organizer / attendee) is switched with the demo bar's cookie.
 */
export async function getViewer(): Promise<Viewer | null> {
  if (isDemoMode()) {
    const as = (await cookies()).get(DEMO_PERSONA_COOKIE)?.value;
    return as === "attendee" ? DEMO_STUDENT : DEMO_ORGANIZER;
  }

  const session = await auth();
  if (!session?.user?.id) return null;

  let verifiedOrganizer = false;
  if (session.user.role === "ORGANIZER" || session.user.role === "ADMIN") {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    });
    verifiedOrganizer = session.user.role === "ADMIN" || profile?.status === "VERIFIED";
  }

  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "Student",
    email: session.user.email ?? "",
    image: session.user.image,
    role: session.user.role,
    verifiedOrganizer,
  };
}

export async function requireUser(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new AuthError(401, "Sign in required.");
  return viewer;
}

/** Hosting actions require role ORGANIZER *and* a VERIFIED profile (or ADMIN). */
export async function requireVerifiedOrganizer(): Promise<Viewer> {
  const viewer = await requireUser();
  if (!viewer.verifiedOrganizer) throw new AuthError(403, "Only verified organizers can do this.");
  return viewer;
}

export type EventPermission = "edit" | "scan" | "broadcast" | "payments";

/** Host, admin, or a team member with the specific permission. */
export async function canManageEvent(viewer: Viewer, eventId: string, perm: EventPermission): Promise<boolean> {
  if (viewer.role === "ADMIN") return true;
  if (isDemoMode()) return viewer.verifiedOrganizer;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      hostId: true,
      team: { where: { userId: viewer.id }, take: 1 },
    },
  });
  if (!event) return false;
  if (event.hostId === viewer.id) return viewer.verifiedOrganizer;

  const m = event.team[0];
  if (!m) return false;
  return { edit: m.canEdit, scan: m.canScan, broadcast: m.canBroadcast, payments: m.canViewPayments }[perm];
}

/** Uniform JSON error response for API routes. */
export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) return Response.json({ error: err.message }, { status: err.status });
  throw err;
}
