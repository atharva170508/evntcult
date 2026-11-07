import { handle, parseBody } from "@/lib/api";
import { run } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/rbac";
import { createHostedEvent } from "@/lib/data/event-write";
import { hostEventSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/create — the "Host an Event" modal. Open to anyone who is logged in;
 * published straight away. A student who hosts their first event becomes an organizer, so the
 * organizer tools (attendees, gate scanner, payments) work for the events they own.
 *   201 { success: true, eventId, slug, becameOrganizer }
 *   400 invalid / invalid_drive_link · 401 unauthenticated · 409 venue_clash / soft_clash
 */
export const POST = handle(async (req: Request) => {
  const viewer = await requireUser();
  const input = await parseBody(req, hostEventSchema);
  const event = await createHostedEvent(viewer, input);

  let becameOrganizer = false;
  if (viewer.role === "attendee") {
    becameOrganizer = (await run("UPDATE users SET role = 'organizer' WHERE id = ? AND role = 'attendee'", viewer.id)) > 0;
    if (becameOrganizer) await audit(viewer.id, "role_change", viewer.id, { from: "attendee", to: "organizer", reason: "hosted_event", eventId: event.id });
  }
  return Response.json({ success: true, eventId: event.id, slug: event.slug, becameOrganizer }, { status: 201 });
});
