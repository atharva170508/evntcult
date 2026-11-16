import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { queueTest } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** POST: a sample message to the organizer's own number. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireEventOwner(ref);
  await queueTest(await getDB(), viewer.id, ref);
  return Response.json({ ok: true });
});
