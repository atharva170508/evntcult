import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { attendeesCsv, listAttendees } from "@/lib/data/organizer-actions";
import { eventAnswers, listQuestions } from "@/lib/data/questions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/**
 * GET /api/events/:id/attendees?q=…            → JSON
 * GET /api/events/:id/attendees?format=csv     → download (Excel / Google Sheets)
 * Organizer only. Never includes phone numbers.
 */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const url = new URL(req.url);
  const event = await first<{ slug: string; price_paise: number }>("SELECT slug, price_paise FROM events WHERE id = ?", ref);
  if (!event) throw new ApiError(404, "not_found", "Event not found.");
  const db = await getDB();
  const rows = await listAttendees(db, ref, url.searchParams.get("q"));

  if (url.searchParams.get("format") === "csv") {
    const day = new Date().toISOString().slice(0, 10);
    const [questions, answers] = await Promise.all([listQuestions(db, ref), eventAnswers(db, ref)]);
    return new Response(attendeesCsv(rows, event.price_paise, { questions, answers }), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug}-attendees-${day}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  return Response.json({ attendees: rows }, { headers: { "Cache-Control": "private, no-store" } });
});
