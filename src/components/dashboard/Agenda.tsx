import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AnnouncementItem, EventSummary, NextUp } from "@/lib/data/types";
import { accentHex } from "@/components/ui/EventArt";
import { seatState } from "@/components/landing/EventCard";
import { UpiPending } from "@/components/dashboard/sections";
import { formatINR } from "@/lib/money";
import { istYmd } from "@/lib/time";
import { fmtDate, fmtTime, relative } from "@/lib/utils";
import { passName } from "@/lib/pass-name";

/**
 * Home, written like a page of a diary (after Things 3's Today): the date set big, a one-line
 * greeting, then the week as an agenda. Your passes stand out with a Show pass button; other
 * events sit quietly with Register; runs of empty days fold into one line.
 */

type Item = EventSummary & { mine?: boolean };

/** Today plus the next n-1 days, each at noon IST so the date never slips across midnight. */
function nextDays(now: Date, n: number): Date[] {
  const [y, m, d] = istYmd(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, d + i, 6, 30)));
}

export function HomeHeader({ name, greeting, mineThisWeek, othersThisWeek, now = new Date() }: { name: string; greeting: string; mineThisWeek: number; othersThisWeek: number; now?: Date }) {
  const summary =
    mineThisWeek + othersThisWeek === 0
      ? "Your week is clear so far."
      : mineThisWeek
        ? `${mineThisWeek === 1 ? "One event" : `${mineThisWeek} events`} of yours this week${othersThisWeek ? `, and ${othersThisWeek} more you could go to` : ""}.`
        : `${othersThisWeek === 1 ? "One event" : `${othersThisWeek} events`} you could go to this week.`;
  return (
    <header className="flex items-end gap-5 pt-8 md:gap-7 md:pt-12">
      <p aria-hidden className="font-display text-[88px] leading-[0.78] tracking-[-0.04em] text-ink md:text-[124px]">
        {fmtDate(now, { day: "numeric" })}
      </p>
      <div className="min-w-0 pb-1">
        <p className="text-[15px] font-medium text-ink-muted">
          {fmtDate(now, { weekday: "long" })}, {fmtDate(now, { month: "long" })} {fmtDate(now, { year: "numeric" })}
        </p>
        <h1 className="mt-1 text-[clamp(24px,2.6vw,32px)] font-semibold leading-tight tracking-[-0.02em] text-ink">
          {greeting}, {name}.
        </h1>
        <p className="mt-1 text-[16px] text-ink-2">{summary}</p>
      </div>
    </header>
  );
}

export function weekItems(upcoming: EventSummary[], others: EventSummary[], now = new Date()) {
  const days = nextDays(now, 7).map((d) => istYmd(d));
  const inWeek = (e: EventSummary) => days.includes(istYmd(e.startsAt)) || (+e.startsAt <= +now && +e.endsAt > +now);
  const mine = upcoming.filter(inWeek).map((e) => ({ ...e, mine: true }));
  const rest = others.filter(inWeek).filter((e) => !mine.some((m) => m.id === e.id));
  return { mine, rest, all: [...mine, ...rest] as Item[] };
}

export function Agenda({ items, next, later, now = new Date() }: { items: Item[]; next: NextUp | null; later: EventSummary[]; now?: Date }) {
  const days = nextDays(now, 7);
  const byDay = new Map<string, Item[]>();
  for (const e of items) {
    const k = +e.startsAt <= +now ? istYmd(now) : istYmd(e.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), e].sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || +a.startsAt - +b.startsAt));
  }
  // Group the week into rows: a day with events, or a run of empty days.
  const rows: ({ kind: "day"; d: Date; list: Item[] } | { kind: "empty"; from: Date; to: Date })[] = [];
  for (const d of days) {
    const list = byDay.get(istYmd(d));
    const last = rows[rows.length - 1];
    if (list?.length) rows.push({ kind: "day", d, list });
    else if (last?.kind === "empty") last.to = d;
    else rows.push({ kind: "empty", from: d, to: d });
  }
  const label = (d: Date) => (istYmd(d) === istYmd(now) ? "Today" : istYmd(d) === istYmd(new Date(+now + 86_400_000)) ? "Tomorrow" : fmtDate(d, { weekday: "short", day: "numeric" }));
  const short = (d: Date) => fmtDate(d, { weekday: "short", day: "numeric" });
  const nextOutside = next && !items.some((e) => e.id === next.id) ? next : null;

  return (
    <section aria-labelledby="week-h">
      <div className="flex items-baseline justify-between border-b border-ink pb-3">
        <h2 id="week-h" className="font-display text-[clamp(28px,2.8vw,36px)] leading-none tracking-[-0.02em] text-ink">
          This week
        </h2>
        <Link href="/calendar" className="-my-3 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-ink-2 hover:text-ink">
          Calendar <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      {/* 7-day strip */}
      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Next 7 days">
        {days.map((d, idx) => {
          const ymd = istYmd(d);
          const list = byDay.get(ymd) ?? [];
          const hasMine = list.some((e) => e.mine);
          const hasOther = list.some((e) => !e.mine);
          const isToday = idx === 0;
          return (
            <Link
              key={ymd}
              href="/calendar"
              className={
                isToday
                  ? "flex flex-col items-center rounded-2xl bg-ink py-2.5 text-canvas shadow-sm transition-transform hover:-translate-y-0.5"
                  : "flex flex-col items-center rounded-2xl border border-line bg-surface py-2.5 text-ink transition-colors hover:border-line-strong hover:bg-sunken"
              }
            >
              <span className={isToday ? "text-[11px] font-medium text-canvas/75" : "text-[11px] font-medium text-ink-muted"}>
                {fmtDate(d, { weekday: "short" })}
              </span>
              <span className="mt-0.5 font-display text-[22px] leading-none tracking-[-0.02em] tabular-nums">
                {fmtDate(d, { day: "numeric" })}
              </span>
              <span className="mt-1.5 flex h-1.5 items-center gap-1" aria-hidden>
                {hasMine && <span className="size-1.5 rounded-full bg-[#E3264F]" />}
                {hasOther && (
                  <span className={isToday ? "size-1.5 rounded-full bg-canvas/75" : "size-1.5 rounded-full bg-ink/40"} />
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="mt-5 border-b border-line pb-6 pt-1">
          <p className="font-display text-[26px] leading-tight tracking-[-0.02em] text-ink">
            Your week is wide open.
          </p>
          <p className="mt-1 text-[14.5px] text-ink-muted">
            No passes booked for the next 7 days. Jump into a filter to fill your calendar.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/events?when=weekend", label: "This weekend" },
              { href: "/events?when=today", label: "Happening today" },
              { href: "/events?price=free", label: "Free events" },
              { href: "/events", label: "Browse all" },
            ].map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-3.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-[#FFFEF6]"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <ol className="mt-2">
          {rows.map((r, i) =>
            r.kind === "empty" ? (
              <li key={i} className="grid gap-x-6 border-b border-line py-3.5 text-[14px] text-ink-subtle sm:grid-cols-[120px_minmax(0,1fr)]">
                <span className="font-medium">{istYmd(r.from) === istYmd(r.to) ? label(r.from) : `${short(r.from)} to ${short(r.to)}`}</span>
                <span>Nothing yet</span>
              </li>
            ) : (
              <li key={i} className="grid gap-x-6 border-b border-line py-5 sm:grid-cols-[120px_minmax(0,1fr)]">
                <p className="pb-2 sm:pb-0 sm:pt-1">
                  <span className="block text-[14px] font-semibold text-ink">{label(r.d)}</span>
                  {label(r.d) === "Today" || label(r.d) === "Tomorrow" ? <span className="text-[13px] text-ink-muted">{fmtDate(r.d, { weekday: "short", day: "numeric" })}</span> : null}
                </p>
                <ul className="space-y-4">
                  {r.list.map((e) =>
                    e.mine ? (
                      <li key={e.id}>
                        <PassRow e={e} serial={next?.id === e.id ? next.passSerial : null} pending={next?.id === e.id && next.paymentStatus === "PENDING"} />
                      </li>
                    ) : (
                      <li key={e.id}>
                        <OtherRow e={e} now={now} />
                      </li>
                    ),
                  )}
                </ul>
              </li>
            ),
          )}
        </ol>
      )}

      {nextOutside && (
        <div className="grid gap-x-6 border-b border-line py-5 sm:grid-cols-[120px_minmax(0,1fr)]">
          <p className="pb-2 sm:pb-0 sm:pt-1">
            <span className="block text-[14px] font-semibold text-ink">Next pass</span>
            <span className="text-[13px] text-ink-muted">{relative(nextOutside.startsAt).replace(/^in /, "In ")}</span>
          </p>
          <PassRow e={nextOutside} serial={nextOutside.passSerial} pending={nextOutside.paymentStatus === "PENDING"} />
        </div>
      )}

      {items.length === 0 && later.length > 0 && (
        <div className="pt-7">
          <h3 className="text-[14px] font-semibold text-ink-muted">After this week</h3>
          <ul className="mt-2 divide-y divide-line">
            {later.slice(0, 3).map((e) => (
              <li key={e.id} className="grid gap-x-6 py-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                <span className="pb-1 text-[14px] font-medium text-ink-2 sm:pb-0 sm:pt-0.5">{fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })}</span>
                <OtherRow e={e} now={now} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {items.length > 0 && (
        <div className="pt-6">
          <Link href="/events" className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-[15px] font-semibold text-white transition-colors hover:bg-black">
            Find something to do
          </Link>
        </div>
      )}
    </section>
  );
}

/** One of your passes: a strip in the event's colour, the facts, and Show pass. */
function PassRow({ e, serial, pending }: { e: EventSummary; serial: string | null; pending?: boolean }) {
  const live = seatState(e) === "live";
  return (
    <div>
      <Link href="/passes" className="group flex items-stretch gap-4 rounded-2xl bg-white p-1.5 pr-4 shadow-[0_0_0_1px_rgb(var(--c-line-strong))] transition-shadow hover:shadow-[0_0_0_1px_rgb(var(--c-ink)),0_12px_28px_-18px_rgba(30,20,5,.45)]">
        <span aria-hidden className="w-2 shrink-0 rounded-[10px]" style={{ background: accentHex(e.accent) }} />
        <span className="min-w-0 flex-1 py-2.5">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink-muted">
            {live ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden /> Happening now
              </span>
            ) : (
              <>
                {fmtTime(e.startsAt)}
                <span>Your pass</span>
              </>
            )}
          </span>
          <span className="mt-0.5 block truncate font-display text-[24px] leading-tight text-ink">{e.title}</span>
          <span className="block truncate text-[14px] text-ink-muted">
            {e.venueName ?? "Venue to be announced"}
            {serial ? <span className="ml-2 text-ink-subtle">{passName(serial).name}</span> : null}
          </span>
        </span>
        <span className="hidden shrink-0 items-center sm:flex">
          <span className="inline-flex h-10 items-center gap-1 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white">
            Show pass <ChevronRight className="size-4" aria-hidden />
          </span>
        </span>
      </Link>
      {pending && (
        <div className="mt-3">
          <UpiPending amountPaise={e.feePaise} />
        </div>
      )}
    </div>
  );
}

/** An event you're not going to (yet): quieter, with Register. */
function OtherRow({ e, now }: { e: EventSummary; now: Date }) {
  const state = seatState(e, now);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  return (
    <Link href={`/events/${e.slug}`} className="group flex items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium tabular-nums text-ink-muted">
          {state === "live" ? <span className="font-semibold text-brand">Happening now</span> : fmtTime(e.startsAt)}
        </span>
        <span className="mt-0.5 block truncate text-[17px] font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{e.title}</span>
        <span className="block truncate text-[14px] text-ink-muted">
          {[e.venueName, e.feePaise > 0 ? formatINR(e.feePaise) : "Free", state === "filling" && left !== null ? `${left} left` : e.registered ? `${e.registered.toLocaleString("en-IN")} going` : null].filter(Boolean).join(", ")}
        </span>
      </span>
      <span className="mt-4 shrink-0 text-[14px] font-semibold text-ink-2 group-hover:text-ink">{state === "full" ? "Waitlist" : "Register"}</span>
    </Link>
  );
}

/** Changes to events you're going to, as a plain feed. */
export function UpdatesFeed({ items }: { items: AnnouncementItem[] }) {
  return (
    <section aria-labelledby="upd-feed-h">
      <div className="flex items-baseline justify-between border-b border-ink pb-3">
        <h2 id="upd-feed-h" className="font-display text-[clamp(28px,2.8vw,36px)] leading-none tracking-[-0.02em] text-ink">
          Updates
        </h2>
        {items.length > 0 && (
          <span className="font-mono text-[12px] font-semibold text-ink-muted">{items.length}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-[14px] leading-relaxed text-ink-muted">
          All quiet on your events. Time or venue changes from organizers show up here automatically.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 4).map((a) => (
            <li key={a.id} className="py-4">
              <p className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[14.5px] font-semibold text-ink">{a.eventTitle}</span>
                <time dateTime={a.createdAt.toISOString()} className="shrink-0 text-[12px] tabular-nums text-ink-subtle">
                  {relative(a.createdAt)}
                </time>
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">{a.title}.</span> {a.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
