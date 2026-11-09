import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { registerSchema } from "@/lib/validation";
import { normalizeAccessCode } from "@/lib/tokens";
import { register, type EventForRegistration } from "@/lib/data/registrations";
import { withRegistrations } from "@/lib/data/registration-api";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { cleanAnswers, listQuestions, saveAnswers } from "@/lib/data/questions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/**
 * POST /api/events/:slug/register  { waitlist?: boolean, code?: string }
 *
 *   201 { status: "registered", registration: { id, pass_code } }
 *   201 { status: "waitlisted", registration: { id }, waitlist_position, hold_expires_at }
 *   200 { full: true, waitlist_position }   ← full, and waitlist wasn't requested: ask the user first
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { ref } = await params;
  const body = await parseBody(req, registerSchema);

  const event = await first<EventForRegistration & { access: string; access_code: string | null; organizer_id: string }>(
    "SELECT id, slug, capacity, status, starts_at, ends_at, access, access_code, organizer_id FROM events WHERE slug = ? OR id = ?",
    ref,
    ref,
  );
  const isOwner = !!event && (viewer.role === "admin" || event.organizer_id === viewer.id);
  if (!event || (event.status === "draft" && !isOwner)) throw new ApiError(404, "not_found", "Event not found.");

  // Private events: the code is required unless you already have a registration (e.g. rejoining).
  if (event.access === "code" && !isOwner) {
    const mine = await first<{ id: string }>("SELECT id FROM registrations WHERE event_id = ? AND user_id = ?", event.id, viewer.id);
    const codeOk = !!body.code && !!event.access_code && normalizeAccessCode(body.code) === event.access_code;
    if (!mine && !codeOk) throw new ApiError(403, "code_required", "This is a private event. Enter its code to register.");
  }

  const db = await getDB();
  // Checked before a seat is taken, so a missing answer can't leave someone half registered.
  const questions = await listQuestions(db, event.id);
  const answers = await withOrganizerActions(async () => cleanAnswers(questions, body.answers));

  const result = await withRegistrations((d) => register(d, event, viewer.id, { waitlist: body.waitlist }));
  if (result.kind !== "full") await saveAnswers(db, result.registration.id, answers);

  if (result.kind === "full") return Response.json({ full: true, waitlist_position: result.position });
  if (result.kind === "waitlisted") {
    return Response.json(
      {
        status: "waitlisted",
        registration: { id: result.registration.id },
        waitlist_position: result.position,
        hold_expires_at: result.registration.hold_expires_at,
      },
      { status: 201 },
    );
  }
  return Response.json(
    { status: "registered", registration: { id: result.registration.id, pass_code: result.registration.pass_code } },
    { status: 201 },
  );
});
