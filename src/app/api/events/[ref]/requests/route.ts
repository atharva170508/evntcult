import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { all, getDB } from "@/lib/db";
import { requireEventOwner, requireUser } from "@/lib/rbac";
import { decideRequest } from "@/lib/data/registrations";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET — people waiting for approval, oldest first. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const requests = await all<{ id: string; name: string; email: string; created_at: string }>(
    `SELECT r.id, u.name, u.email, r.created_at FROM registrations r JOIN users u ON u.id = r.user_id
      WHERE r.event_id = ? AND r.status = 'waitlisted' ORDER BY r.created_at LIMIT 200`,
    ref,
  );
  return Response.json({ requests });
});

const body = z.object({ registrationId: z.string().min(1).max(64), action: z.enum(["approve", "decline"]) }).strict();

/** POST { registrationId, action } — approve (issues the pass) or decline a request. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const viewer = await requireUser();
  const b = await parseBody(req, body);
  const result = await decideRequest(await getDB(), ref, b.registrationId, b.action, viewer.id);
  if (result === "not_found") throw new ApiError(404, "not_found", "That request was already handled.");
  if (result === "full") throw new ApiError(409, "full", "The event is full. Raise the capacity to approve more people.");
  return Response.json({ result });
});
