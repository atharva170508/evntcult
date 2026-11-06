import { ApiError, handle } from "@/lib/api";
import { first } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { buildIcs, icsFileName } from "@/lib/ics";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/registrations/:id/ics — "Add to calendar" for one of my passes. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { id } = await params;
  const row = await first<{ id: string; status: string; pass_code: string; slug: string; title: string; venue: string; starts_at: string; ends_at: string }>(
    `SELECT r.id, r.status, r.pass_code, e.slug, e.title, e.venue, e.starts_at, e.ends_at
       FROM registrations r JOIN events e ON e.id = r.event_id
      WHERE r.id = ? AND r.user_id = ?`,
    id,
    viewer.id,
  );
  if (!row || row.status === "cancelled") throw new ApiError(404, "not_found", "Pass not found.");

  const url = new URL(`/events/${row.slug}`, req.url).toString();
  const ics = buildIcs({
    uid: `${row.id}@evntcult`,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.venue,
    description:
      row.status === "registered"
        ? `Your pass: ${row.pass_code}. Show the QR code from My passes at the gate.\n${url}`
        : `You're on the waitlist. If a seat opens, confirm it on EvntCult.\n${url}`,
    url,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFileName(row.title)}"`,
      "Cache-Control": "private, no-store",
    },
  });
});
