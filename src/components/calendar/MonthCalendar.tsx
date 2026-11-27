"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { MonthPayload } from "@/lib/data/calendar";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const time = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const dayLabel = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${d}T00:00:00Z`),
  );
const dayWeekdayMonth = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", month: "long", timeZone: "UTC" }).format(
    new Date(`${d}T00:00:00Z`),
  );

type Ev = MonthPayload["events"][number];

/** Open on today if something's on; otherwise the next day with events (or today if in current month). */
function startDay(m: MonthPayload) {
  const inMonth = m.cells.includes(m.today);
  const days = [...new Set(m.events.map((e) => e.day))].sort();
  if (inMonth) return days.includes(m.today) ? m.today : (days.find((d) => d > m.today) ?? m.today);
  return days[0] ?? (m.cells.find(Boolean) as string);
}

const yours = (e: Ev) => !!e.mine || e.hosting;

function tag(e: Ev): [string, ChipTone] | null {
  if (e.status === "cancelled") return ["Cancelled", "danger"];
  if (e.hosting) return [e.status === "draft" ? "Your draft" : "Hosting", "accent"];
  if (e.mine === "registered") return ["Going", "dark"];
  if (e.mine === "waitlisted") return ["Waitlist", "warn"];
  return null;
}

function pill(e: Ev) {
  if (e.status === "cancelled") return "bg-danger-soft text-danger line-through";
  if (e.mine === "registered") return "bg-[#D4B87A] text-[#161820]";
  if (e.mine === "waitlisted") return "bg-warn-soft text-warn";
  if (e.hosting) return "bg-accent-soft text-accent-ink";
  return "bg-sunken text-ink-2";
}

/**
 * Unified Apple Calendar / Cron–inspired month view with a docked full-height Day Inspector.
 * Eliminates harsh spreadsheet gridlines, floating half-height sidebars, and loud selection boxes.
 */
export function MonthCalendar({
  initial,
  signedIn,
  className,
}: {
  initial: MonthPayload;
  signedIn: boolean;
  className?: string;
}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string>(() => startDay(initial));
  const [onlyMine, setOnlyMine] = useState(false);
  const grid = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => (onlyMine ? data.events.filter(yours) : data.events), [data.events, onlyMine]);
  const byDay = useMemo(() => {
    const map = new Map<string, Ev[]>();
    for (const e of shown) map.set(e.day, [...(map.get(e.day) ?? []), e]);
    return map;
  }, [shown]);

  const days = data.cells.filter(Boolean) as string[];
  const dayEvents = byDay.get(selected) ?? [];
  const nextBusyDay = useMemo(
    () =>
      [...byDay.keys()]
        .filter((d) => d !== selected && d >= data.today)
        .sort()[0] ??
      [...byDay.keys()].filter((d) => d !== selected).sort()[0] ??
      null,
    [byDay, selected, data.today],
  );

  async function go(month: string) {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/calendar?month=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const next = (await res.json()) as MonthPayload;
      setData(next);
      setSelected(startDay(next));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    const i = days.indexOf(selected);
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    let to: number | null =
      step !== undefined ? i + step : e.key === "Home" ? 0 : e.key === "End" ? days.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    to = Math.max(0, Math.min(days.length - 1, to));
    setSelected(days[to]);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-day="${days[to!]}"]`)?.focus());
  }

  const selDayNum = selected ? Number(selected.slice(8)) : "";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[4px] border border-line bg-surface",
        className,
      )}
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* LEFT: Unified Month Matrix */}
        <div className="min-w-0 p-4 sm:p-6">
          {/* Clean toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2.5">
              <h3
                className="font-display text-[28px] italic leading-none tracking-[-0.02em] text-ink sm:text-[32px]"
                aria-live="polite"
              >
                {data.label}
              </h3>
              {loading && <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-subtle">Loading...</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {signedIn && (
                <div role="group" aria-label="Filter calendar events" className="inline-flex rounded-[4px] border border-line bg-canvas p-0.5">
                  {[
                    { mine: false, label: "All" },
                    { mine: true, label: "Mine" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      aria-pressed={onlyMine === opt.mine}
                      onClick={() => setOnlyMine(opt.mine)}
                      className={cn(
                        "h-8 rounded-[3px] px-3.5 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors",
                        onlyMine === opt.mine
                          ? "bg-[#D4B87A] text-[#161820]"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="inline-flex items-center rounded-[4px] border border-line bg-canvas p-0.5">
                <button
                  type="button"
                  onClick={() => go(data.prev)}
                  aria-label="Previous month"
                  className="grid size-8 place-items-center rounded-[3px] text-ink-2 transition-colors hover:bg-surface hover:text-ink"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(initial.key)}
                  disabled={data.key === initial.key}
                  className="h-8 rounded-[3px] px-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-surface disabled:opacity-40"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => go(data.next)}
                  aria-label="Next month"
                  className="grid size-8 place-items-center rounded-[3px] text-ink-2 transition-colors hover:bg-surface hover:text-ink"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {failed && (
            <p role="alert" className="mb-4 rounded-[4px] bg-danger-soft px-4 py-2.5 text-[13.5px] font-medium text-danger">
              That month didn&apos;t load. Try again.
            </p>
          )}

          {/* Weekday header */}
          <div className="grid grid-cols-7 pb-2" aria-hidden>
            {WEEKDAYS.map((d, idx) => (
              <div
                key={d}
                className={cn(
                  "text-center font-mono text-[10px] uppercase tracking-[0.14em]",
                  idx >= 5 ? "text-ink-subtle" : "text-ink-muted",
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Architectural day cells */}
          <div
            ref={grid}
            role="group"
            aria-label={`${data.label}. Use arrow keys to move between days.`}
            onKeyDown={onKey}
            className={cn(
              "grid grid-cols-7 gap-1 transition-opacity duration-fast",
              loading && "opacity-55",
            )}
          >
            {data.cells.map((day, i) => {
              if (!day) {
                return <div key={`b${i}`} role="presentation" className="min-h-[52px] rounded-[4px] md:min-h-[72px]" />;
              }
              const list = byDay.get(day) ?? [];
              const mine = list.filter(yours);
              const isToday = day === data.today;
              const isSel = day === selected;
              const isWeekend = i % 7 >= 5;

              return (
                <button
                  key={day}
                  type="button"
                  data-day={day}
                  tabIndex={isSel ? 0 : -1}
                  aria-pressed={isSel}
                  aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}: ${
                    list.length
                      ? `${list.length} event${list.length > 1 ? "s" : ""}${mine.length ? `, ${mine.length} yours` : ""}`
                      : "no events"
                  }`}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "group relative flex min-h-[52px] min-w-0 flex-col items-center rounded-[4px] p-1.5 text-left transition-all duration-150 md:min-h-[72px] md:items-start md:p-2",
                    isSel
                      ? "bg-sunken ring-1 ring-inset ring-[#D4B87A]/60"
                      : isWeekend
                        ? "bg-canvas/55 hover:bg-sunken/70"
                        : "hover:bg-sunken/70",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-[3px] text-[13px] tabular-nums transition-colors",
                      isToday
                        ? "bg-[#D4B87A] font-semibold text-[#161820]"
                        : isSel
                          ? "bg-[#EFEAE0] font-semibold text-[#161820]"
                          : list.length
                            ? "font-semibold text-ink"
                            : "font-medium text-ink-2 group-hover:text-ink",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>

                  {/* Mobile dots */}
                  {list.length > 0 && (
                    <span className="mt-1 flex gap-1 md:hidden" aria-hidden>
                      {list.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={cn(
                            "size-1.5 rounded-full",
                            yours(e) ? "bg-[#D4B87A]" : "bg-ink/45",
                          )}
                        />
                      ))}
                    </span>
                  )}

                  {/* Desktop compact event pills */}
                  {list.length > 0 && (
                    <span className="mt-1 hidden w-full flex-col gap-0.5 md:flex" aria-hidden>
                      {list.slice(0, 1).map((e) => (
                        <span
                          key={e.id}
                          className={cn(
                            "truncate rounded-[3px] px-1.5 py-0.5 text-[11px] font-medium leading-tight",
                            pill(e),
                          )}
                        >
                          {e.title}
                        </span>
                      ))}
                      {list.length > 1 && (
                        <span className="px-1 text-[10.5px] font-medium text-ink-muted">
                          +{list.length - 1} more
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {signedIn && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#D4B87A]" aria-hidden /> Today &amp; Passes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-ink/40" aria-hidden /> All events
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: Full-height docked Day Inspector */}
        <aside
          aria-live="polite"
          aria-label={`Events on ${dayLabel(selected)}`}
          className="flex min-w-0 flex-col justify-between border-t border-line bg-canvas/40 p-5 sm:p-6 lg:border-l lg:border-t-0"
        >
          <div>
            {/* Editorial date block */}
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[48px] italic leading-[0.86] tracking-[-0.03em] tabular-nums text-[#D4B87A]">
                  {selDayNum}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ink">{dayWeekdayMonth(selected)}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">
                    {selected === data.today
                      ? "Today"
                      : dayEvents.length > 0
                        ? `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`
                        : "Open day"}
                  </p>
                </div>
              </div>
              {selected === data.today && (
                <span className="rounded-[3px] border border-[#D4B87A]/40 bg-[#D4B87A]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#D4B87A]">
                  Today
                </span>
              )}
            </div>

            {dayEvents.length === 0 ? (
              <div className="py-6">
                <p className="text-[14.5px] font-medium text-ink-2">
                  No events on this day{onlyMine ? " for you" : ""}.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextBusyDay && (
                    <button
                      type="button"
                      onClick={() => setSelected(nextBusyDay)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-[#D4B87A] px-3.5 text-[12px] font-medium uppercase tracking-[0.1em] text-[#161820] transition-opacity hover:opacity-90"
                    >
                      <CalendarDays className="size-3.5" aria-hidden />
                      Next: {dayLabel(nextBusyDay).split(",")[1]?.trim() || nextBusyDay}
                    </button>
                  )}
                  <Link
                    href="/events"
                    className="inline-flex h-9 items-center gap-1 rounded-[4px] border border-line bg-surface px-3.5 text-[12px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:border-[#D4B87A]/60"
                  >
                    Browse
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {dayEvents.map((e) => {
                  const t = tag(e);
                  const href = e.hosting ? `/organizer/events/${e.id}` : `/events/${e.slug}`;
                  return (
                    <li key={e.id} className="py-3.5">
                      <div className="flex items-center justify-between gap-2 text-[12px] tabular-nums text-ink-muted">
                        <span className="font-mono text-[#D4B87A]">{time(e.startsAt)}</span>
                        {t && <Chip tone={t[1]}>{t[0]}</Chip>}
                      </div>
                      {signedIn ? (
                        <Link
                          href={href}
                          className="group mt-1 flex items-start justify-between gap-2 font-display text-[20px] italic text-ink transition-colors hover:text-[#D4B87A]"
                        >
                          <span>{e.title}</span>
                          <ArrowUpRight className="mt-1 size-4 shrink-0 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D4B87A]" aria-hidden />
                        </Link>
                      ) : (
                        <p className="mt-1 font-display text-[20px] italic text-ink">{e.title}</p>
                      )}
                      {e.venue && (
                        <p className="mt-1 flex items-center gap-1.5 truncate text-[12.5px] text-ink-muted">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{e.venue}</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!signedIn && dayEvents.length > 0 && (
            <Link
              href="/signin?mode=signup"
              className="mt-4 flex h-11 w-full items-center justify-center rounded-[4px] bg-[#D4B87A] text-[12px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-opacity hover:opacity-90"
            >
              Sign up to register
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
