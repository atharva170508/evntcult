import { z } from "zod";
import { moderated } from "@/lib/moderation/zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { EFFECT_KEYS } from "@/lib/effects";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

interface Rules {
  regClosesAt: string | null;
  requiresApproval: boolean;
  agenda: string | null;
  effect: string | null;
  refundPolicy: string | null;
  look: string | null;
  confirmMessage: string | null;
}

const body = z
  .object({
    regClosesAt: z.string().datetime().nullable(),
    requiresApproval: z.boolean(),
    agenda: z.string().max(2000).superRefine(moderated("Agenda")).nullable(),
    effect: z.enum(EFFECT_KEYS).nullable().optional(),
    refundPolicy: z.string().max(600).superRefine(moderated("Refund policy")).nullable().optional(),
    look: z.string().regex(/^[a-z]+:[a-z]+$/).max(30).nullable().optional(),
    confirmMessage: z.string().max(500).superRefine(moderated("Confirmation message")).nullable().optional(),
  })
  .strict();

async function read(ref: string): Promise<Rules> {
  const e = await first<{ reg_closes_at: string | null; requires_approval: number | null; agenda: string | null; effect: string | null; refund_policy: string | null; look: string | null; confirm_message: string | null }>(
    "SELECT reg_closes_at, requires_approval, agenda, effect, refund_policy, look, confirm_message FROM events WHERE id = ?",
    ref,
  );
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  return { regClosesAt: e.reg_closes_at, requiresApproval: !!e.requires_approval, agenda: e.agenda, effect: e.effect, refundPolicy: e.refund_policy, look: e.look, confirmMessage: e.confirm_message };
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
    .prepare("UPDATE events SET reg_closes_at = ?, requires_approval = ?, agenda = ?, effect = COALESCE(?, effect), refund_policy = CASE WHEN ? THEN ? ELSE refund_policy END, look = COALESCE(?, look), confirm_message = CASE WHEN ? THEN ? ELSE confirm_message END, updated_at = ? WHERE id = ?")
    .bind(b.regClosesAt, b.requiresApproval ? 1 : 0, agenda, b.effect === undefined ? null : (b.effect ?? "none"), b.refundPolicy === undefined ? 0 : 1, b.refundPolicy?.trim() || null, b.look ?? null, b.confirmMessage === undefined ? 0 : 1, b.confirmMessage?.trim() || null, new Date().toISOString(), ref)
    .run();
  return Response.json(await read(ref));
});
