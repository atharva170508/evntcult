import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { issueBulk } from "@/lib/data/certificates";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** POST: a certificate for everyone currently checked in. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireEventOwner(ref);
  return Response.json(await issueBulk(await getDB(), ref, viewer.id));
});
