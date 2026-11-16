import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { inbox, markAllRead } from "@/lib/data/inbox";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const v = await requireUser();
  return Response.json(await inbox(await getDB(), v.id), { headers: { "Cache-Control": "private, no-store" } });
});

/** POST: the bell was opened. */
export const POST = handle(async () => {
  const v = await requireUser();
  await markAllRead(await getDB(), v.id);
  return Response.json({ ok: true });
});
