import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { choiceTallies } from "@/lib/data/questions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /api/events/:id/counts.csv — the caterer and vendor sheet: every choice question, counted. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const e = await first<{ title: string; slug: string }>("SELECT title, slug FROM events WHERE id = ?", ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  const tallies = await choiceTallies(await getDB(), ref);
  const lines = [["Question", "Answer", "Guests"].join(",")];
  for (const t of tallies) {
    for (const c of t.counts) lines.push([cell(t.question.label), cell(c.option), c.n].join(","));
    if (t.total > t.answered) lines.push([cell(t.question.label), "No answer", t.total - t.answered].join(","));
    lines.push([cell(t.question.label), "Total confirmed", t.total].join(","));
  }
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}-counts.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
