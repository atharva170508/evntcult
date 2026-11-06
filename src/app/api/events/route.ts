import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validation";
import { requireVerifiedOrganizer, authErrorResponse } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";
import { findClashes } from "@/lib/clash-db";
import { hasHardClash } from "@/lib/clash";
import { generateEventCode } from "@/lib/event-code";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

/** POST /api/events — create (and optionally publish) an event. Verified organizers only. */
export async function POST(req: Request) {
  let viewer;
  try {
    viewer = await requireVerifiedOrganizer();
  } catch (e) {
    return authErrorResponse(e);
  }

  const parsed = createEventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event", issues: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (isDemoMode()) {
    return NextResponse.json({ error: "Event creation is disabled in demo mode." }, { status: 501 });
  }

  // Clash gate — only matters when publishing (drafts can overlap while planning).
  if (input.publish) {
    const clashes = await findClashes({
      venueId: input.venueId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      category: input.category,
      expectedAttendance: input.capacity,
    });
    if (hasHardClash(clashes) || (clashes.length && !input.acknowledgeSoftClashes)) {
      return NextResponse.json({ error: "Schedule clash", clashes, blocking: hasHardClash(clashes) }, { status: 409 });
    }
  }

  const { publish, acknowledgeSoftClashes: _ack, ...data } = input;
  void _ack;
  const baseSlug = slugify(data.title) || "event";

  try {
    const event = await prisma.$transaction(async (tx) => {
      const taken = await tx.event.count({ where: { slug: { startsWith: baseSlug } } });
      const created = await tx.event.create({
        data: {
          ...data,
          slug: taken ? `${baseSlug}-${taken + 1}` : baseSlug,
          status: publish ? "PUBLISHED" : "DRAFT",
          hostId: viewer.id,
          upiPayeeName: data.upiVpa ? viewer.name : null,
          codes: data.visibility === "CODE_ONLY" ? { create: { code: generateEventCode(), label: "Default" } } : undefined,
        },
        include: { codes: { select: { code: true } } },
      });
      await tx.auditLog.create({
        data: { actorId: viewer.id, action: publish ? "event.publish" : "event.create", target: `event:${created.id}` },
      });
      return created;
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    // The Postgres exclusion constraint caught a race the pre-check missed.
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("event_no_venue_overlap")) {
      return NextResponse.json({ error: "That venue was just booked for an overlapping slot. Pick another time." }, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Duplicate value — please retry." }, { status: 409 });
    }
    throw err;
  }
}
