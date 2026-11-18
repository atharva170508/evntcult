import Link from "next/link";
import { ArrowRight, CalendarClock, ChevronRight, MapPin, Megaphone } from "lucide-react";
import type { AnnouncementItem, EventSummary, NextUp } from "@/lib/data/types";
import { EventArt } from "@/components/ui/EventArt";
import { UpiPending } from "@/components/dashboard/sections";
import { seatState } from "@/components/landing/EventCard";
import { formatINR } from "@/lib/money";
import { istYmd } from "@/lib/time";
import { fmtDate, fmtTime, relative } from "@/lib/utils";

type Day = { campus: number; mine: number };

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

/** Today's date and what the coming week holds, under the greeting. */
export function TodayLine({ calendar, now = new Date() }: { calendar: Record<string, Day>; now?: Date }) {
  const week = nextDays(now, 7).reduce((n, d) => n + (calendar[istYmd(d)]?.campus ?? 0), 0);
  return (
    <p className="mt-3 text-[16px] text-ink-2">
      {fmtDate(now, { weekday: "long", day: "numeric", month: "long" })}.{" "}
      <span className="text-ink-muted">
        {week === 0
          ? "Nothing on campus in the next 7 days yet."
          : `${week} ${week === 1 ? "event" : "events"} on campus in the next 7 days.`}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Pass                                                                */
/* ------------------------------------------------------------------ */

/** The next event I'm registered for, shaped like the pass it opens. */
export function NextPass({ next }: { next: NextUp }) {
  return (
    <Link
      href="/passes"
      className="group grid overflow-hidden rounded-[20px] border border-line-strong bg-white transition-shadow duration-fast hover:shadow-raised sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div className="relative min-h-[150px] sm:min-h-[240px]">
        <EventArt accent={next.accent} seed={next.id} scrim={false} />
        <span className="absolute left-4 top-4 rounded-md bg-white px-2 py-1 text-[12.5px] font-semibold text-ink shadow-[0_1px_2px_rgba(20,22,27,0.12)]">
          {relative(next.startsAt)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col p-6">
        <h2 className="line-clamp-2 font-display text-[28px] leading-[1.05] tracking-[-0.02em] text-ink">{next.title}</h2>
        <p className="mt-3 text-[15px] text-ink-2">
          {fmtDate(next.startsAt, { weekday: "long", day: "numeric", month: "long" })}, {fmtTime(next.startsAt)}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-ink-muted">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{next.venueName ?? "Venue to be announced"}</span>
        </p>
        <div className="min-h-5 flex-1" aria-hidden />
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-line-strong pt-4">
          <span className="font-mono text-[13px] tabular-nums text-ink-muted">{next.passSerial}</span>
          <span className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink px-4 text-[14px] font-semibold text-white">
            Show pass <ChevronRight className="size-4" aria-hidden />
          </span>
        </div>
        {next.paymentStatus === "PENDING" && (
          <div className="mt-4">
            <UpiPending amountPaise={next.feePaise} />
          </div>
        )}
      </div>
    </Link>
  );
}

/** No passes yet: show where the pass will go, and the real events it could be for. */
export function FirstPass({ campus }: { campus: EventSummary[] }) {
  const picks = campus.slice(0, 3);
  return (
    <section aria-labelledby="first-pass" className="overflow-hidden rounded-[20px] border border-line-strong bg-white">
      <div className="flex items-center gap-5 p-6 sm:gap-6 sm:p-7">
        <PassOutline />
        <div className="min-w-0">
          <h2 id="first-pass" className="font-display text-[30px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[34px]">
            Your first pass goes here.
          </h2>
          <p className="mt-2 max-w-[46ch] text-[15px] text-ink-2">
            Register for an event and its pass appears on this card, ready to scan at the gate.
          </p>
        </div>
      </div>

      {picks.length > 0 && (
        <div className="border-t border-line">
          <h3 className="px-6 pt-4 text-[14px] font-semibold text-ink sm:px-7">Coming up on campus</h3>
          <ul className="mt-1 pb-2">
            {picks.map((e) => (
              <li key={e.id}>
                <EventLine e={e} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line bg-sunken/60 px-6 py-4 sm:px-7">
        <Link
          href="/events"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-[15px] font-semibold text-white transition-colors duration-fast hover:bg-ink-2"
        >
          Browse all events <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href="/calendar"
          className="inline-flex min-h-11 items-center text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[5px] transition-colors duration-fast hover:decoration-ink"
        >
          Open the calendar
        </Link>
      </div>
    </section>
  );
}

/** More public events I haven't registered for, under my next pass. */
export function AlsoOn({ campus }: { campus: EventSummary[] }) {
  const picks = campus.slice(0, 3);
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="also-on" className="overflow-hidden rounded-[20px] border border-line-strong bg-white">
      <div className="flex items-baseline justify-between px-6 pt-5 sm:px-7">
        <h2 id="also-on" className="text-[16px] font-semibold text-ink">
          Also on campus
        </h2>
        <Link
          href="/events"
          className="-my-3 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-ink-2 hover:text-ink"
        >
          All events <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-1 pb-2">
        {picks.map((e) => (
          <li key={e.id}>
            <EventLine e={e} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One event as a row: date, what and where, then price or seats. */
function EventLine({ e }: { e: EventSummary }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const note =
    state === "live"
      ? "Happening now"
      : state === "full"
        ? "Full"
        : state === "filling" && left !== null
          ? `${left} left`
          : e.feePaise > 0
            ? formatINR(e.feePaise)
            : "Free";
  const urgent = state === "live" || state === "filling";
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 px-6 py-3 transition-colors duration-fast hover:bg-sunken sm:px-7"
    >
      <span className="flex flex-col items-center rounded-lg border border-line-strong bg-canvas py-1.5 leading-none">
        <span className="text-[11.5px] font-medium text-ink-muted">{fmtDate(e.startsAt, { month: "short" })}</span>
        <span className="mt-1 font-display text-[22px] tabular-nums text-ink">{fmtDate(e.startsAt, { day: "numeric" })}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15.5px] font-semibold text-ink">{e.title}</span>
        <span className="block truncate text-[13.5px] text-ink-muted">
          {fmtDate(e.startsAt, { weekday: "short" })}, {fmtTime(e.startsAt)}
          {e.venueName ? `, ${e.venueName}` : ""}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className={`text-[13.5px] tabular-nums ${urgent ? "font-semibold text-accent-ink" : "text-ink-2"}`}>{note}</span>
        <ChevronRight
          className="size-4 text-ink-subtle transition-transform duration-fast group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}

/** A drawn, empty pass: notched ticket, perforation, and a faint code block. */
function PassOutline() {
  return (
    <svg viewBox="0 0 96 120" className="h-[104px] w-[84px] shrink-0 sm:h-[120px] sm:w-[96px]" aria-hidden>
      <path
        d="M10 2h76a8 8 0 0 1 8 8v58a8 8 0 0 0 0 16v26a8 8 0 0 1-8 8H10a8 8 0 0 1-8-8V84a8 8 0 0 0 0-16V10a8 8 0 0 1 8-8Z"
        fill="#FFFEF6"
        stroke="#DCD6C6"
        strokeWidth="1.5"
      />
      <line x1="12" y1="76" x2="84" y2="76" stroke="#DCD6C6" strokeWidth="1.5" strokeDasharray="3 4" />
      <rect x="14" y="14" width="34" height="5" rx="2.5" fill="#ECE8DC" />
      <rect x="14" y="24" width="22" height="4" rx="2" fill="#ECE8DC" />
      <g fill="#E6E1D3">
        {[0, 1, 2, 3, 4].flatMap((r) =>
          [0, 1, 2, 3, 4].map((c) =>
            (r * 7 + c * 3) % 4 !== 0 ? <rect key={`${r}${c}`} x={52 + c * 6} y={38 + r * 6} width="5" height="5" rx="1" /> : null,
          ),
        )}
      </g>
      <rect x="14" y="90" width="40" height="4" rx="2" fill="#ECE8DC" />
      <rect x="14" y="99" width="26" height="4" rx="2" fill="#ECE8DC" />
      <circle cx="78" cy="98" r="6" fill="#F0D7FF" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Side column                                                         */
/* ------------------------------------------------------------------ */

/** The next 7 days: how much is on, and which days have my events. */
export function WeekStrip({ calendar, now = new Date() }: { calendar: Record<string, Day>; now?: Date }) {
  const days = nextDays(now, 7);
  return (
    <section aria-labelledby="week" className="rounded-[20px] border border-line-strong bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="week" className="text-[16px] font-semibold text-ink">
          Next 7 days
        </h2>
        <Link
          href="/calendar"
          className="-my-3 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-ink-2 hover:text-ink"
        >
          Calendar <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const c = calendar[istYmd(d)] ?? { campus: 0, mine: 0 };
          const label = `${fmtDate(d, { weekday: "long", day: "numeric", month: "long" })}: ${
            c.campus === 0 ? "nothing on" : `${c.campus} on campus${c.mine ? `, ${c.mine} yours` : ""}`
          }`;
          return (
            <li
              key={i}
              aria-label={label}
              className={`flex flex-col items-center rounded-xl py-2.5 ${
                i === 0 ? "bg-ink text-white" : c.campus ? "bg-sunken text-ink" : "text-ink-muted"
              }`}
            >
              <span className={`text-[12px] font-medium ${i === 0 ? "text-white/70" : "text-ink-muted"}`}>
                {i === 0 ? "Today" : fmtDate(d, { weekday: "short" })}
              </span>
              <span className="mt-1 text-[18px] font-semibold tabular-nums leading-none">{fmtDate(d, { day: "numeric" })}</span>
              <span className="mt-2 flex h-1.5 items-center gap-[3px]" aria-hidden>
                {Array.from({ length: Math.min(c.campus, 3) }, (_, k) => (
                  <span
                    key={k}
                    className={`size-1.5 rounded-full ${
                      k < c.mine ? "bg-accent" : i === 0 ? "bg-white/60" : "bg-ink-subtle/50"
                    }`}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex items-center gap-4 text-[12.5px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Yours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-ink-subtle/50" aria-hidden /> On campus
        </span>
      </p>
    </section>
  );
}

const KIND_ICON = {
  SCHEDULE_CHANGE: CalendarClock,
  VENUE_CHANGE: MapPin,
  INFO: Megaphone,
} as const;

/** Changes to events I'm going to (or hosting), newest first. */
export function Updates({ items }: { items: AnnouncementItem[] }) {
  return (
    <section aria-labelledby="updates" className="rounded-[20px] border border-line-strong bg-white p-5">
      <h2 id="updates" className="text-[16px] font-semibold text-ink">
        Updates
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-[14px] text-ink-muted">
          When an event you&apos;re going to changes its time or venue, you&apos;ll see it here.
        </p>
      ) : (
        <ul className="mt-1">
          {items.slice(0, 3).map((a) => {
            const Icon = KIND_ICON[a.kind as keyof typeof KIND_ICON] ?? Megaphone;
            return (
              <li key={a.id} className="flex gap-3 border-t border-line py-3.5 first:border-t-0">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-ink-2">
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14.5px] font-semibold text-ink">{a.eventTitle}</p>
                    <time dateTime={a.createdAt.toISOString()} className="shrink-0 text-[12.5px] tabular-nums text-ink-subtle">
                      {relative(a.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-2">
                    <span className="text-ink-muted">{a.title}: </span>
                    {a.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Today plus the next n-1 days, each at noon IST so the date never slips across midnight. */
function nextDays(now: Date, n: number): Date[] {
  const [y, m, d] = istYmd(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, d + i, 6, 30)));
}
