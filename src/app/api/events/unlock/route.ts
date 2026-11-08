import { ApiError, handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { first } from "@/lib/db";
import { normalizeAccessCode } from "@/lib/tokens";
import { isValidCustomCode } from "@/lib/organizer/shared";
import { unlockSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/events/unlock — the private-event code. Same generic error for every failure. */
export const POST = handle(async (req: Request) => {
  await requireUser();
  const { code } = await parseBody(req, unlockSchema);
  const c = normalizeAccessCode(code);
  const notFound = () => new ApiError(404, "code_not_found", "That code didn't match an event. Check it with the organizer.");
  if (!isValidCustomCode(c)) throw notFound();
  const e = await first<{ title: string; slug: string }>(
    "SELECT title, slug FROM events WHERE access = 'code' AND access_code = ? AND status = 'published'",
    c,
  );
  if (!e) throw notFound();
  return Response.json({ event: e });
});
