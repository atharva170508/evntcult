import Link from "next/link";
import { istHm } from "@/lib/time";
import { fmtDate, istDayLabel } from "./time";
import type { EventSummary } from "@/lib/data/types";
import { seatState } from "./EventCard";
import { LiveClock } from "./LiveClock";

const STATUS = {
  live: { label: "Boarding", cls: "bg-[#12A56F]/15 text-[#5EE0A8]" },
  filling: { label: "Filling fast", cls: "bg-[#F5B544]/15 text-[#F7C66B]" },
  full: { label: "Full", cls: "bg-white/[0.08] text-white/55" },
  open: { label: "Open", cls: "bg-white/[0.06] text-white/75" },
} as const;

/** Split-flap characters: each one turns over into place when the board first appears. */
function Flaps({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="inline-flex gap-[2px] [perspective:400px]" aria-label={text}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className={
            ch === ":"
              ? "w-[0.35em] text-center text-[#C9A45C]/70"
              : "inline-block w-[0.72em] rounded-[3px] bg-white/[0.07] text-center text-[#E9CF94] [transform-origin:50%_50%] motion-safe:animate-flap"
          }
          style={{ animationDelay: `${delay + i * 55}ms` }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

/**
 * The homepage's centrepiece: what's leaving soonest, as a terminal departures board.
 * Time, event, gate (venue) and status, all live from the database.
 */
export function Departures({ events }: { events: EventSummary[] }) {
  return (
    <section aria-labelledby="departures-h" className="relative overflow-hidden rounded-[26px] bg-night text-white shadow-[0_30px_80px_-30px_rgba(11,22,38,0.55)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full bg-[#12A56F] motion-safe:animate-ping" />
            <span className="relative size-2 rounded-full bg-[#12A56F]" />
          </span>
          <h2 id="departures-h" className="text-[14px] font-semibold tracking-[0.01em]">
            Departures
          </h2>
          <span className="text-[13px] text-white/45">· campus events</span>
        </div>
        <LiveClock className="font-mono text-[13px] tabular-nums text-white/60" />
      </div>

      {events.length === 0 ? (
        <p className="px-6 py-14 text-center text-[14.5px] text-white/60">The board is clear for now. New events appear here the moment they&apos;re published.</p>
      ) : (
        <>
          <div className="hidden grid-cols-[84px_1fr_auto] gap-4 px-6 pb-2 pt-4 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/35 sm:grid">
            <span>Time</span>
            <span>Event · Gate</span>
            <span className="text-right">Status</span>
          </div>
          <ol>
            {events.map((e, i) => {
              const s = STATUS[seatState(e)];
              const day = istDayLabel(e.startsAt);
              return (
                <li key={e.id} className="border-t border-white/[0.06] first:border-t-0 sm:first:border-t">
                  <Link
                    href={`/events/${e.slug}`}
                    className="group grid grid-cols-[76px_1fr_auto] items-center gap-x-3 px-5 py-3.5 transition-colors duration-fast hover:bg-white/[0.04] sm:grid-cols-[84px_1fr_auto] sm:gap-x-4 sm:px-6"
                  >
                    <span className="font-mono text-[17px] font-medium tabular-nums">
                      <Flaps text={istHm(e.startsAt)} delay={180 + i * 120} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold group-hover:underline group-hover:decoration-white/40 group-hover:underline-offset-4">{e.title}</span>
                      <span className="block truncate text-[12.5px] text-white/45">
                        {day === "Today" ? "Today" : `${day} ${fmtDate(e.startsAt)}`}
                        <span className="text-white/25"> · </span>
                        {e.venueName ?? "Venue TBA"}
                      </span>
                    </span>
                    <span className="flex justify-end">
                      <span className={`rounded-md px-2 py-1 text-[11.5px] font-semibold ${s.cls}`}>{s.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
      <Link
        href="/events"
        className="flex items-center justify-between border-t border-white/[0.08] px-5 py-4 text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white sm:px-6"
      >
        Every upcoming event
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
