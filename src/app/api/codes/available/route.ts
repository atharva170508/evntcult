import { ApiError, handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { codeAvailable } from "@/lib/data/organizer-events";
import { isValidCustomCode, normalizeCode } from "@/lib/organizer/shared";

export const dynamic = "force-dynamic";

/** GET /api/codes/available?code=&eventId= */
export const GET = handle(async (req: Request) => {
  await requireUser();
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  if (!isValidCustomCode(code)) throw new ApiError(400, "invalid", "Use 4 to 20 letters or numbers.");
  return Response.json({ code: normalizeCode(code), available: await codeAvailable(await getDB(), code, url.searchParams.get("eventId") ?? undefined) });
});
