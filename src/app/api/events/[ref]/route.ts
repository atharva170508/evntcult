import { ApiError, handle, parseBody } from "@/lib/api";
import { getViewer } from "@/lib/rbac";
import { getEventDetail } from "@/lib/data/events";
import { saveEvent } from "@/lib/data/organizer-events";
import { orgHandle, ownedEvent, type RefCtx } from "@/lib/organizer/route";
import { saveEventSchema } from "@/lib/validation";
import { passQrPayload } from "@/lib/tokens";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET /api/events/:slug — includes seats_left and my_registration. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await getViewer();
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

/** PATCH /api/events/:id: partial save with the version the client last saw. 409 on conflict. */
export const PATCH = orgHandle(async (req: Request, ctx: RefCtx) => {
  const { id, viewer, db } = await ownedEvent(ctx);
  const { version, ...fields } = await parseBody(req, saveEventSchema);
  return Response.json(await saveEvent(db, viewer, id, version, fields));
});
