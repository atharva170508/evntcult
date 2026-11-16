import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { waPanel } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET: counts and the next five sends. Never message contents. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json(await waPanel(await getDB(), ref));
});
