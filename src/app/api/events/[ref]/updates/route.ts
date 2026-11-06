import { handle, parseBody } from "@/lib/api";
import { requireEventOwner } from "@/lib/rbac";
import { eventUpdateSchema } from "@/lib/validation";
import { postEventUpdate } from "@/lib/data/organizer-actions";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { whatsappConnected } from "@/lib/notify";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/**
 * POST /api/events/:id/updates  { kind: "schedule" | "venue" | "update", body, whatsapp }
 * Shows on the event's dashboards right away. With whatsapp: true it is also queued for
 * registered students who opted in (sending starts once a provider is connected).
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireEventOwner(ref);
  const body = await parseBody(req, eventUpdateSchema);
  const r = await withOrganizerActions((db) => postEventUpdate(db, { eventId: ref, actorId: viewer.id, ...body }));
  return Response.json({ ok: true, update: { id: r.id }, whatsapp: { queued: r.queued, connected: whatsappConnected() } }, { status: 201 });
});
