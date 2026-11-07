import { handle, parseBody } from "@/lib/api";
import { requireOrganizer } from "@/lib/rbac";
import { createHostedEvent } from "@/lib/data/event-write";
import { hostEventSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/create — the "Host an Event" modal. Organizers only; published straight away.
 *   201 { success: true, eventId, slug }
 *   400 invalid / invalid_drive_link · 403 forbidden · 409 venue_clash / soft_clash
 */
export const POST = handle(async (req: Request) => {
  const viewer = await requireOrganizer();
  const input = await parseBody(req, hostEventSchema);
  const event = await createHostedEvent(viewer, input);
  return Response.json({ success: true, eventId: event.id, slug: event.slug }, { status: 201 });
});
