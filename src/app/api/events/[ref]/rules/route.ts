import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

interface Rules {
  regClosesAt: string | null;
  requiresApproval: boolean;
  agenda: string | null;
}

const body = z
  .object({
    regClosesAt: z.string().datetime().nullable(),
    requiresApproval: z.boolean(),
    agenda: z.string().max(2000).nullable(),
  })
  .strict();

async function read(ref: string): Promise<Rules> {
  const e = await first<{ reg_closes_at: string | null; requires_approval: number | null; agenda: string | null }>(
    "SELECT reg_closes_at, requires_approval, agenda FROM events WHERE id = ?",
    ref,
  );
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  return { regClosesAt: e.reg_closes_at, requiresApproval: !!e.requires_approval, agenda: e.agenda };
}

/** GET — the event's sign-up rules: cutoff, host approval, agenda. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json(await read(ref));
});

/** PUT — save them. The agenda keeps up to 20 non-empty lines. */
export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const b = await parseBody(req, body);
  const agenda =
    b.agenda
      ?.split("\n")
      .map((l) => l.trim().slice(0, 140))
      .filter(Boolean)
      .slice(0, 20)
      .join("\n") || null;
  const db = await getDB();
  await db
    .prepare("UPDATE events SET reg_closes_at = ?, requires_approval = ?, agenda = ?, updated_at = ? WHERE id = ?")
    .bind(b.regClosesAt, b.requiresApproval ? 1 : 0, agenda, new Date().toISOString(), ref)
    .run();
  return Response.json(await read(ref));
});
