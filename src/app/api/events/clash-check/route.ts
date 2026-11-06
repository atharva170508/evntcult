import { NextResponse } from "next/server";
import { slotSchema } from "@/lib/validation";
import { requireVerifiedOrganizer, authErrorResponse } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";
import { findClashes } from "@/lib/clash-db";
import { hasHardClash } from "@/lib/clash";

/**
 * POST /api/events/clash-check
 * Live feedback for the event builder as the organizer picks venue + time.
 */
export async function POST(req: Request) {
  try {
    await requireVerifiedOrganizer();
  } catch (e) {
    return authErrorResponse(e);
  }

  const parsed = slotSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid slot", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ clashes: [], blocking: false, demo: true });
  }

  const { eventId, ...slot } = parsed.data;
  const clashes = await findClashes({ id: eventId, ...slot });
  return NextResponse.json({ clashes, blocking: hasHardClash(clashes) });
}
