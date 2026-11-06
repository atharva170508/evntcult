import "server-only";
import { prisma } from "@/lib/prisma";
import { detectClashes, type SlotCandidate } from "@/lib/clash";

const DAY = 86_400_000;

/** Load the relevant slice of the calendar and run clash detection. */
export async function findClashes(candidate: SlotCandidate) {
  const existing = await prisma.event.findMany({
    where: {
      status: { in: ["PUBLISHED", "LIVE"] },
      // widen by a day so venue buffers at the edges are considered
      startsAt: { lt: new Date(+candidate.endsAt + DAY) },
      endsAt: { gt: new Date(+candidate.startsAt - DAY) },
      ...(candidate.id ? { id: { not: candidate.id } } : {}),
    },
    select: {
      id: true,
      title: true,
      venueId: true,
      startsAt: true,
      endsAt: true,
      status: true,
      category: true,
      capacity: true,
      venue: { select: { name: true, bufferMinutes: true } },
    },
  });

  return detectClashes(
    candidate,
    existing.map((e) => ({ ...e, venueName: e.venue?.name, bufferMinutes: e.venue?.bufferMinutes })),
  );
}
