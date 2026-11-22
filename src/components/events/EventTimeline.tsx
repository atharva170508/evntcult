import Link from "next/link";
import type { EventSummary } from "@/lib/data/types";
import { EventArt } from "@/components/ui/EventArt";
import { seatState } from "@/components/landing/EventCard";
import { formatINR } from "@/lib/money";
import { istYmd } from "@/lib/time";
import { fmtDate, fmtTime } from "@/lib/utils";

/**
 * Luma-style list: events grouped by day, the day pinned on the left while you scroll
 * its events, each row with time, title, venue, price and how full it is.
 */
export function EventTimeline({ events, now = new Date() }: { events: EventSummary[]; now?: Date }) {
  const today = istYmd(now);
  const tomorrow = istYmd(new Date(+now + 86_400_000));
  const groups = new Map<string, EventSummary[]>();
  for (const e of events) {
    const k = istYmd(e.startsAt);
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }

  return (
    <div className="mt-6 space-y-10">
      {[...groups.entries()].map(([day, list]) => {
        const d = list[0].startsAt;
        const label = day === today ? "Today" : day === tomorrow ? "Tomorrow" : fmtDate(d, { weekday: "long" });
        return (
          <section key={day} aria-label={`${label}, ${fmtDate(d, { day: "numeric", month: "long" })}`} className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)] md:gap-8">
            <h2 className="md:sticky md:top-[calc(var(--header-h)+24px)] md:self-start">
              <span className="text-[17px] font-semibold text-ink">{label}</span>{" "}
              <span className="text-[15px] text-ink-muted md:block">{fmtDate(d, { day: "numeric", month: "short" })}</span>
            </h2>
            <ul className="relative space-y-3 border-l border-dashed border-line-strong pl-5 md:pl-6">
              {list.map((e) => (
                <li key={e.id} className="relative" data-peek={e.slug}>
                  <span className="absolute -left-[25px] top-6 size-2 rounded-full bg-line-strong ring-4 ring-canvas md:-left-[29px]" aria-hidden />
                  <TimelineRow e={e} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TimelineRow({ e }: { e: EventSummary }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group flex items-start gap-4 rounded-2xl border border-line-strong bg-white p-4 transition-[box-shadow,transform] duration-fast hover:-translate-y-0.5 hover:shadow-raised"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] tabular-nums text-ink-muted">
          {fmtTime(e.startsAt)}
          {state === "live" && <span className="ml-2 font-semibold text-accent-ink">Happening now</span>}
        </p>
        <p className="mt-1 line-clamp-2 text-[18px] font-semibold leading-snug text-ink">{e.title}</p>
        {e.venueName && <p className="mt-1 truncate text-[14px] text-ink-muted">{e.venueName}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
          {state === "full" ? (
            <span className="rounded-md bg-danger-soft px-2 py-0.5 font-semibold text-danger">Sold out</span>
          ) : state === "filling" && left !== null ? (
            <span className="rounded-md bg-accent-soft px-2 py-0.5 font-semibold text-accent-ink">{left} left</span>
          ) : null}
          <span className="rounded-md bg-sunken px-2 py-0.5 font-medium tabular-nums text-ink-2">{e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}</span>
          {e.registered > 0 && <span className="tabular-nums text-ink-muted">{e.registered.toLocaleString("en-IN")} going</span>}
        </div>
      </div>
      <div className="relative size-[88px] shrink-0 overflow-hidden rounded-xl bg-sunken sm:size-[104px]">
        <EventArt accent={e.accent} seed={e.id} scrim={false} />
      </div>
    </Link>
  );
}
