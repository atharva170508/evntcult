import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { merchClaimsCsv } from "@/lib/data/merch";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return new Response(await merchClaimsCsv(await getDB(), ref), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="merch-claims.csv"', "Cache-Control": "no-store" } });
});
