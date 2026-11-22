import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { all, first } from "@/lib/db";
import { SEATS_TAKEN_SQL, toSummary, type EventRowWithCount } from "@/lib/data/events";
import { EventCard } from "@/components/landing/EventCard";
import { EventArt } from "@/components/ui/EventArt";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Host" };

/** Luma's host profile: who runs these events, what's coming up, what they've run before. */
export default async function HostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const host = await first<{ id: string; name: string; created_at: string; host_club: string | null }>(
    "SELECT id, name, created_at, host_club FROM users WHERE id = ? AND role IN ('organizer','admin')",
    id,
  );
  if (!host) notFound();

  const now = new Date().toISOString();
  const [rows, totals] = await Promise.all([
    all<EventRowWithCount>(
      `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e
        WHERE e.organizer_id = ? AND e.access = 'public' AND e.status IN ('published','closed')
        ORDER BY e.starts_at DESC LIMIT 60`,
      host.id,
    ),
    first<{ came: number }>(
      `SELECT COUNT(*) AS came FROM checkins c JOIN events e ON e.id = c.event_id WHERE e.organizer_id = ? AND e.access = 'public'`,
      host.id,
    ),
  ]);
  const upcoming = rows.filter((e) => e.ends_at > now && e.status === "published").reverse().map(toSummary);
  const past = rows.filter((e) => e.ends_at <= now);
  const initials = host.name
    .trim()
    .split(/\s+/)
    .map((p, i, a) => (i === 0 || i === a.length - 1 ? p[0] : ""))
    .join("")
    .toUpperCase();

  return (
    <div className="pb-10 pt-8 md:pt-12">
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-center">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-ink font-display text-[30px] text-white" aria-hidden>
          {initials}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[40px] leading-[1.02] tracking-[-0.025em] text-ink md:text-[48px]">{host.host_club ?? host.name}</h1>
          {host.host_club && <p className="mt-1 text-[16px] text-ink-2">Run by {host.name}</p>}
          <p className="mt-2 text-[15px] tabular-nums text-ink-muted">
            {rows.length} {rows.length === 1 ? "event" : "events"} hosted
            {!!totals?.came && <>, {totals.came.toLocaleString("en-IN")} people checked in</>}, hosting since {fmtDate(new Date(host.created_at), { month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      <section aria-labelledby="up-h" className="pt-8">
        <h2 id="up-h" className="text-[22px] font-semibold text-ink">
          Coming up
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink-muted">Nothing scheduled right now. Check back soon.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {upcoming.map((e) => (
              <li key={e.id}>
                <EventCard e={e} rows />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-h" className="mt-12 border-t border-line pt-8">
          <h2 id="past-h" className="text-[22px] font-semibold text-ink">
            Past events
          </h2>
          <ul className="mt-5 grid gap-x-6 gap-y-4 md:grid-cols-2">
            {past.map((e) => {
              const s = toSummary(e);
              return (
                <li key={e.id}>
                  <Link href={`/events/${e.slug}`} className="group flex items-center gap-4 rounded-xl p-1 transition-colors duration-fast hover:bg-sunken">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                      <EventArt accent={s.accent} seed={s.id} scrim={false} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15.5px] font-semibold text-ink">{e.title}</span>
                      <span className="block truncate text-[13.5px] tabular-nums text-ink-muted">
                        {fmtDate(new Date(e.starts_at), { day: "numeric", month: "short", year: "numeric" })}, {e.taken} went
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
