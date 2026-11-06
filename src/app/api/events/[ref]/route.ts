import { ApiError, handle, parseBody } from "@/lib/api";
import { requireEventOwner, requireUser } from "@/lib/rbac";
import { getEventDetail } from "@/lib/data/events";
import { updateEvent } from "@/lib/data/event-write";
import { patchEventSchema } from "@/lib/validation";
import { passQrPayload } from "@/lib/tokens";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET /api/events/:slug — includes seats_left and my_registration. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { ref } = await params;
  const d = await getEventDetail(ref, viewer, new URL(req.url).searchParams.get("code"));
  if (!d) throw new ApiError(404, "not_found", "Event not found.");
  const e = d.event;
  return Response.json({
    event: {
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      category: e.category,
      venue: e.venue,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      capacity: e.capacity,
      price_paise: e.price_paise,
      status: e.status,
      access: e.access,
      ...(d.isOwner ? { access_code: e.access_code } : {}),
    },
    seats_left: d.seatsLeft,
    my_registration: d.myRegistration
      ? {
          id: d.myRegistration.id,
          status: d.myRegistration.status,
          pass_code: d.myRegistration.pass_code,
          qr: d.myRegistration.status === "registered" ? passQrPayload(d.myRegistration.pass_token) : null,
          payment_status: d.myRegistration.payment_status,
          checked_in_at: d.myRegistration.checked_in_at,
        }
      : null,
  });
});

/** PATCH /api/events/:id — owner only. Capacity can't go below seats already taken. */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireEventOwner(ref);
  const input = await parseBody(req, patchEventSchema);
  const e = await updateEvent(viewer, ref, input);
  return Response.json({ event: { id: e.id, slug: e.slug, status: e.status, capacity: e.capacity, access_code: e.access_code } });
});
