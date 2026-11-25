import { z } from "zod";
import { moderated } from "@/lib/moderation/zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first } from "@/lib/db";
import { requireGateAccess } from "@/lib/volunteers";
import { addWalkIn, type EventForRegistration } from "@/lib/data/registrations";
import { withRegistrations } from "@/lib/data/registration-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const body = z
  .object({
    name: z.string().trim().min(1, "Add their name.").max(80).superRefine(moderated("Name")),
    email: z.string().trim().email("That email doesn't look right.").max(200).nullable().optional(),
  })
  .strict();

/** POST { name, email? } — add someone at the door and check them in. Organizer or gate volunteer. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const access = await requireGateAccess(ref);
  const b = await parseBody(req, body);
  const event = await first<EventForRegistration>("SELECT id, slug, capacity, status, starts_at, ends_at FROM events WHERE id = ?", ref);
  if (!event) throw new ApiError(404, "not_found", "Event not found.");
  if (event.status !== "published") throw new ApiError(409, "not_open", "Publish the event first.");
  const r = await withRegistrations((db) => addWalkIn(db, event, { name: b.name, email: b.email ?? null }, access.actorId));
  return Response.json({ passCode: r.registration.pass_code, alreadyIn: r.alreadyIn }, { status: 201 });
});
