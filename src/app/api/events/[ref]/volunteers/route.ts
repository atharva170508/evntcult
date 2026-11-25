import { z } from "zod";
import { moderated } from "@/lib/moderation/zod";
import { brandQr } from "@/lib/qr-art";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { createVolunteerLink, listVolunteerLinks, revokeVolunteerLink } from "@/lib/volunteers";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const createBody = z
  .object({
    label: z.string().trim().min(1, "Give the link a name, like “Gate 2, Rohan”.").max(60).superRefine(moderated("Link name")),
    role: z.enum(["gate", "gate_merch"]),
    expires: z.enum(["event_end", "12h", "24h"]),
  })
  .strict();

/** GET — this event's volunteer links (never the tokens). */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json({ links: await listVolunteerLinks(ref) });
});

/** POST — create a link. The URL (and a QR for it) is returned once and never stored. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireEventOwner(ref);
  const b = await parseBody(req, createBody);
  const e = await first<{ ends_at: string; status: string }>("SELECT ends_at, status FROM events WHERE id = ?", ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  const now = Date.now();
  // Links last until a few hours after the event ends (late scans, merch), or a fixed window.
  const expiresAt =
    b.expires === "event_end" ? new Date(Math.max(Date.parse(e.ends_at) + 4 * 3_600_000, now + 3_600_000)) : new Date(now + (b.expires === "12h" ? 12 : 24) * 3_600_000);
  const { id, token } = await createVolunteerLink({ eventId: ref, label: b.label, role: b.role, expiresAt, createdBy: viewer.id });
  const url = new URL(`/v/${token}`, req.url).toString();
  const qrSvg = brandQr(url, { kind: "volunteer" });
  return Response.json({ id, url, qrSvg, expiresAt: expiresAt.toISOString() }, { status: 201 });
});

/** DELETE ?id= — turn a link off. The volunteer's next scan is refused. */
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "bad_request", "Which link?");
  await revokeVolunteerLink(ref, id);
  return Response.json({ ok: true });
});
