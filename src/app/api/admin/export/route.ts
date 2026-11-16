import { ApiError, handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireOwner } from "@/lib/owner";
import { adminExport } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/** GET /api/admin/export?type=users|events — CSV for the owners. No phone numbers. */
export const GET = handle(async (req: Request) => {
  await requireOwner();
  const type = new URL(req.url).searchParams.get("type");
  if (type !== "users" && type !== "events") throw new ApiError(400, "bad_type", "Choose users or events.");
  return new Response(await adminExport(await getDB(), type), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="evntcult-${type}.csv"`, "Cache-Control": "no-store" },
  });
});
