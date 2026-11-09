import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { createMerchItem, deleteMerchItem, listMerch } from "@/lib/data/merch";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const item = z
  .object({ name: z.string().trim().min(1).max(80), variant: z.string().trim().max(40).nullable().optional(), stock: z.number().int().min(0).max(1_000_000).nullable().optional() })
  .strict();

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json({ items: await listMerch(await getDB(), ref) });
});

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const id = await createMerchItem(await getDB(), ref, await parseBody(req, item));
  return Response.json({ id }, { status: 201 });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const itemId = new URL(req.url).searchParams.get("item");
  if (!itemId) throw new ApiError(400, "no_item", "Choose an item.");
  await withOrganizerActions((db) => deleteMerchItem(db, ref, itemId));
  return Response.json({ ok: true });
});
