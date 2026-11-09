import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { setCertificatesEnabled } from "@/lib/data/certificates";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** POST { enabled }: issue automatically at check-in, or not. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const { enabled } = await parseBody(req, z.object({ enabled: z.boolean() }).strict());
  await setCertificatesEnabled(await getDB(), ref, enabled);
  return Response.json({ ok: true });
});
