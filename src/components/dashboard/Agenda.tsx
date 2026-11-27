import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AnnouncementItem, EventSummary, NextUp } from "@/lib/data/types";
import { seatState } from "@/components/landing/EventCard";
import { UpiPending } from "@/components/dashboard/sections";
import { formatINR } from "@/lib/money";
import { istYmd } from "@/lib/time";
import { fmtDate, fmtTime, relative } from "@/lib/utils";
import { passName } from "@/lib/pass-name";

type Item = EventSummary & { mine?: boolean };

function nextDays(now: Date, n: number): Date[] {
  const [y, m, d] = istYmd(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, d + i, 6, 30)));
}

export function HomeHeader({
  name,
  greeting,
  mineThisWeek,
  othersThisWeek,
  now = new Date(),
}: {
  name: string;
  greeting: string;
  mineThisWeek: number;
  othersThisWeek: number;
  now?: Date;
}) {
  return (
    <header className="border-b border-line pb-6 pt-8">
      <p className="tr-meta text-ink-muted">
        {fmtDate(now, { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <h1 className="mt-2 font-display text-[clamp(36px,4.5vw,56px)] font-bold italic leading-[0.94] text-ink">
        {greeting}, <span className="text-[#D4B87A]">{name}.</span>
      </h1>
      <p className="tr-meta mt-3 text-ink-muted">
        {mineThisWeek + othersThisWeek} this week
      </p>
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

export function Agenda({
  items,
  next,
  later,
  now = new Date(),
}: {
  items: Item[];
  next: NextUp | null;
  later: EventSummary[];
  now?: Date;
}) {
  const days = nextDays(now, 7);
  const byDay = new Map<string, Item[]>();
  for (const e of items) {
    const k = +e.startsAt <= +now ? istYmd(now) : istYmd(e.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), e].sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || +a.startsAt - +b.startsAt));
  }
  const rows: ({ kind: "day"; d: Date; list: Item[] } | { kind: "empty"; from: Date; to: Date })[] = [];
  for (const d of days) {
    const list = byDay.get(istYmd(d));
    const last = rows[rows.length - 1];
    if (list?.length) rows.push({ kind: "day", d, list });
    else if (last?.kind === "empty") last.to = d;
    else rows.push({ kind: "empty", from: d, to: d });
  }
  const label = (d: Date) =>
    istYmd(d) === istYmd(now)
      ? "Today"
      : istYmd(d) === istYmd(new Date(+now + 86_400_000))
        ? "Tomorrow"
        : fmtDate(d, { weekday: "short", day: "numeric" });
  const short = (d: Date) => fmtDate(d, { weekday: "short", day: "numeric" });
  const nextOutside = next && !items.some((e) => e.id === next.id) ? next : null;

  return (
    <section aria-labelledby="week-h">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 id="week-h" className="font-display text-[clamp(28px,3vw,40px)] font-bold italic leading-none text-ink">
          This Week
        </h2>
        <Link href="/calendar" className="tr-meta tr-link inline-flex min-h-[44px] items-center gap-1 text-ink-muted hover:text-[#D4B87A]">
          Calendar <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {/* Sharp 7-day strip */}
      <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Next 7 days">
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
                  ? "flex flex-col items-center rounded-[4px] bg-[#D4B87A] py-2.5 text-[#161820]"
                  : "flex flex-col items-center rounded-[4px] border border-line bg-surface py-2.5 text-ink transition-colors hover:border-[#D4B87A]/50"
              }
            >
              <span className={isToday ? "font-mono text-[10px] uppercase text-[#161820]/75" : "font-mono text-[10px] uppercase text-ink-muted"}>
                {fmtDate(d, { weekday: "short" })}
              </span>
              <span className="mt-1 font-display text-[24px] font-semibold italic leading-none tabular-nums">
                {fmtDate(d, { day: "numeric" })}
              </span>
              <span className="mt-1.5 flex h-1.5 items-center gap-1" aria-hidden>
                {hasMine && <span className={isToday ? "size-1.5 rounded-full bg-[#161820]" : "size-1.5 rounded-full bg-[#D4B87A]"} />}
                {hasOther && <span className={isToday ? "size-1.5 rounded-full bg-[#161820]/45" : "size-1.5 rounded-full bg-ink-muted"} />}
              </span>
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 border-b border-line pb-7 pt-2">
          <p className="font-display text-[28px] italic text-ink">Nothing scheduled.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/events?when=weekend", label: "Weekend" },
              { href: "/events?when=today", label: "Today" },
              { href: "/events?price=free", label: "Free" },
              { href: "/events", label: "All events" },
            ].map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="tr-meta inline-flex min-h-[40px] items-center rounded-[4px] border border-line bg-surface px-3.5 text-ink-muted transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <ol className="mt-3">
          {rows.map((r, i) =>
            r.kind === "empty" ? (
              <li key={i} className="grid gap-x-6 border-b border-line py-3.5 text-[13.5px] font-light text-ink-muted sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="font-mono text-[11px] uppercase">
                  {istYmd(r.from) === istYmd(r.to) ? label(r.from) : `${short(r.from)} / ${short(r.to)}`}
                </span>
                <span>Open</span>
              </li>
            ) : (
              <li key={i} className="grid gap-x-6 border-b border-line py-5 sm:grid-cols-[110px_minmax(0,1fr)]">
                <p className="pb-2 sm:pb-0 sm:pt-1">
                  <span className="tr-meta block text-[#D4B87A]">{label(r.d)}</span>
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
        <div className="grid gap-x-6 border-b border-line py-5 sm:grid-cols-[110px_minmax(0,1fr)]">
          <p className="pb-2 sm:pb-0 sm:pt-1">
            <span className="tr-meta block text-[#D4B87A]">Next pass</span>
            <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">
              {relative(nextOutside.startsAt).replace(/^in /, "In ")}
            </span>
          </p>
          <PassRow e={nextOutside} serial={nextOutside.passSerial} pending={nextOutside.paymentStatus === "PENDING"} />
        </div>
      )}

      {items.length === 0 && later.length > 0 && (
        <div className="pt-8">
          <h3 className="tr-meta text-ink-muted">Coming up</h3>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {later.slice(0, 3).map((e) => (
              <li key={e.id} className="grid gap-x-6 py-4 sm:grid-cols-[110px_minmax(0,1fr)]">
                <span className="font-mono text-[11.5px] text-ink-muted sm:pt-1">
                  {fmtDate(e.startsAt, { day: "numeric", month: "short" })}
                </span>
                <OtherRow e={e} now={now} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function PassRow({ e, serial, pending }: { e: EventSummary; serial: string | null; pending?: boolean }) {
  const live = seatState(e) === "live";
  return (
    <div>
      <Link
        href="/passes"
        className="group flex items-center justify-between gap-4 border-l-2 border-[#D4B87A] bg-surface px-4 py-3.5 transition-colors hover:bg-sunken"
      >
        <span className="min-w-0 flex-1">
          <span className="tr-meta block text-[#D4B87A]">
            {live ? "Live now" : `${fmtTime(e.startsAt)} · Your pass`}
          </span>
          <span className="mt-1 block truncate font-display text-[26px] font-semibold italic leading-tight text-ink">
            {e.title}
          </span>
          <span className="mt-0.5 block truncate text-[13.5px] font-light text-ink-muted">
            {e.venueName ?? "Venue TBA"}
            {serial ? ` · ${passName(serial).name}` : ""}
          </span>
        </span>
        <span className="tr-meta hidden shrink-0 items-center gap-1.5 text-[#D4B87A] sm:inline-flex">
          Pass <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
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

function OtherRow({ e, now }: { e: EventSummary; now: Date }) {
  const state = seatState(e, now);
  return (
    <Link href={`/events/${e.slug}`} className="group flex items-baseline justify-between gap-4">
      <span className="min-w-0">
        <span className="font-mono text-[11.5px] tabular-nums text-ink-muted">
          {state === "live" ? "Live" : fmtTime(e.startsAt)}
        </span>
        <span className="mt-0.5 block truncate font-display text-[24px] font-semibold italic leading-tight text-ink transition-colors group-hover:text-[#D4B87A]">
          {e.title}
        </span>
        <span className="block truncate text-[13.5px] font-light text-ink-muted">
          {[e.venueName, e.feePaise > 0 ? formatINR(e.feePaise) : "Free"].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="tr-meta shrink-0 text-ink-muted group-hover:text-[#D4B87A]">
        {state === "full" ? "Waitlist" : "Open"}
      </span>
    </Link>
  );
}

export function UpdatesFeed({ items }: { items: AnnouncementItem[] }) {
  return (
    <section aria-labelledby="upd-feed-h">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <h2 id="upd-feed-h" className="font-display text-[clamp(28px,3vw,40px)] font-bold italic leading-none text-ink">
          Updates
        </h2>
        {items.length > 0 && (
          <span className="font-mono text-[11px] text-[#D4B87A]">{items.length}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-5 text-[14px] font-light text-ink-muted">No updates.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.slice(0, 4).map((a) => (
            <li key={a.id} className="py-4">
              <p className="flex items-baseline justify-between gap-3">
                <span className="truncate font-display text-[20px] font-semibold italic text-ink">{a.eventTitle}</span>
                <time dateTime={a.createdAt.toISOString()} className="shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
                  {relative(a.createdAt)}
                </time>
              </p>
              <p className="mt-1 text-[13.5px] font-light text-ink-muted">
                <span className="font-medium text-ink">{a.title}.</span> {a.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
