import type { Metadata } from "next";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { calendarWindow } from "@/lib/data/organizer-events";
import { MISSING_LABEL, istDate, missingForPublish } from "@/lib/organizer/shared";
import { CalendarView } from "@/components/organizer-ui/CalendarView";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const viewer = (await getViewer())!;
  const { m } = await searchParams;
  const today = istDate(new Date());
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(m ?? "") ? m! : today.slice(0, 7);
  const [y, mo] = month.split("-").map(Number);
  const from = new Date(`${month}-01T00:00:00+05:30`).toISOString();
  const nextMonth = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  const to = new Date(`${nextMonth}-01T00:00:00+05:30`).toISOString();

  const db = await getDB();
  const [{ events, clashes }, details, week] = await Promise.all([
    calendarWindow(db, viewer.id, from, to),
    db
      .prepare("SELECT id, title, category, venue, venue_status, description, price_paise, organizer_upi_id, access, access_code, starts_at FROM events WHERE organizer_id = ? AND status = 'draft' AND ends_at >= ? AND starts_at < ? ORDER BY starts_at")
      .bind(viewer.id, from, to)
      .all<Parameters<typeof missingForPublish>[0] & { id: string; title: string; starts_at: string }>(),
    calendarWindow(db, viewer.id, new Date().toISOString(), new Date(Date.now() + 7 * 86_400_000).toISOString()),
  ]);
  const drafts = details.results.map((d) => ({ id: d.id, title: d.title, starts_at: d.starts_at, missing: missingForPublish(d).map((x) => MISSING_LABEL[x]) }));

  return <CalendarView key={month} month={month} today={today} events={events} clashes={clashes} drafts={drafts} week={week.events.filter((e) => e.status !== "draft").slice(0, 5)} />;
}
