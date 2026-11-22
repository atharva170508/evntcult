"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MonthPayload } from "@/lib/data/calendar";
import { buttonClass } from "@/components/ui/Button";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const time = (iso: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const dayLabel = (d: string) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

type Ev = MonthPayload["events"][number];

/** Open on today if something's on; otherwise the next day with events (or the first, for other months). */
function startDay(m: MonthPayload) {
  const inMonth = m.cells.includes(m.today);
  const days = [...new Set(m.events.map((e) => e.day))].sort();
  if (inMonth) return days.includes(m.today) ? m.today : (days.find((d) => d > m.today) ?? m.today);
  return days[0] ?? (m.cells.find(Boolean) as string);
}
const yours = (e: Ev) => !!e.mine || e.hosting;

/** The same words and colours as the full Calendar page. */
function tag(e: Ev): [string, ChipTone] | null {
  if (e.status === "cancelled") return ["Cancelled", "danger"];
  if (e.hosting) return [e.status === "draft" ? "Your draft" : "Hosting", "accent"];
  if (e.mine === "registered") return ["Going", "dark"];
  if (e.mine === "waitlisted") return ["Waitlist", "warn"];
  return null;
}
function pill(e: Ev) {
  if (e.status === "cancelled") return "bg-danger-soft text-danger line-through";
  if (e.mine === "registered") return "bg-night text-white";
  if (e.mine === "waitlisted") return "bg-warn-soft text-warn";
  if (e.hosting) return "bg-accent-soft text-accent-ink";
  return "bg-sunken text-ink-2";
}

/**
 * The interactive month on the homepage (visitors) and the signed-in home.
 * Pick a day (click, or arrow keys then Enter) to see what's on. ‹ › change month; Today jumps back.
 * Signed in, your registrations and events you host are filled; other campus events are plain.
 * Visitors see public events only and are asked to sign up to open one.
 */
export function MonthCalendar({ initial, signedIn, className }: { initial: MonthPayload; signedIn: boolean; className?: string }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string>(() => startDay(initial));
  const [onlyMine, setOnlyMine] = useState(false);
  const grid = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => (onlyMine ? data.events.filter(yours) : data.events), [data.events, onlyMine]);
  const byDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of shown) m.set(e.day, [...(m.get(e.day) ?? []), e]);
    return m;
  }, [shown]);
  const days = data.cells.filter(Boolean) as string[];
  const dayEvents = byDay.get(selected) ?? [];

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

  // Roving focus: one day sits in the Tab order; the arrow keys move between days.
  function onKey(e: React.KeyboardEvent) {
    const i = days.indexOf(selected);
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    let to: number | null = step !== undefined ? i + step : e.key === "Home" ? 0 : e.key === "End" ? days.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    to = Math.max(0, Math.min(days.length - 1, to));
    setSelected(days[to]);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-day="${days[to!]}"]`)?.focus());
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]", className)}>
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[20px] font-semibold tracking-[-0.01em] text-ink" aria-live="polite">
            {data.label}
            {loading && <span className="ml-2 text-[13px] font-medium text-ink-subtle">Loading…</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {signedIn && (
              <div role="group" aria-label="Which events" className="inline-flex rounded-full bg-sunken p-1">
                {[false, true].map((mine) => (
                  <button
                    key={String(mine)}
                    type="button"
                    aria-pressed={onlyMine === mine}
                    onClick={() => setOnlyMine(mine)}
                    className={cn(
                      "min-h-8 rounded-xl px-3.5 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-fast",
                      onlyMine === mine ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {mine ? "Only mine" : "All events"}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 rounded-full border border-line-strong bg-white p-1">
              <button type="button" onClick={() => go(data.prev)} className={buttonClass("ghost", "sm", "w-8 px-0")} aria-label="Previous month">
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={() => go(initial.key)} disabled={data.key === initial.key} className={buttonClass("ghost", "sm")}>
                Today
              </button>
              <button type="button" onClick={() => go(data.next)} className={buttonClass("ghost", "sm", "w-8 px-0")} aria-label="Next month">
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {failed && (
          <p role="alert" className="mb-3 rounded-lg bg-danger-soft px-4 py-2.5 text-[14px] font-medium text-danger">
            That month didn&apos;t load. Try again.
          </p>
        )}

        <div className={cn("card overflow-hidden transition-opacity duration-fast", loading && "opacity-60")}>
          <div className="grid grid-cols-7 border-b border-line" aria-hidden>
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-[12px] font-medium text-ink-subtle">
                {d}
              </div>
            ))}
          </div>
          <div ref={grid} role="group" aria-label={`${data.label}. Use the arrow keys to move between days.`} onKeyDown={onKey} className="grid grid-cols-7 gap-px bg-line">
            {data.cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} role="presentation" className="min-h-[52px] bg-canvas/60 md:min-h-[96px]" />;
              const list = byDay.get(day) ?? [];
              const mine = list.filter(yours);
              const isToday = day === data.today;
              const isSel = day === selected;
              return (
                <button
                  key={day}
                  type="button"
                  data-day={day}
                  tabIndex={isSel ? 0 : -1}
                  aria-pressed={isSel}
                  aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}: ${list.length ? `${list.length} event${list.length > 1 ? "s" : ""}${mine.length ? `, ${mine.length} yours` : ""}` : "no events"}`}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex min-h-[52px] min-w-0 flex-col items-start gap-1 p-1.5 text-left transition-colors duration-fast md:min-h-[96px] md:p-2",
                    isSel ? "bg-lavender/45" : "bg-surface hover:bg-sunken",
                    isSel && "ring-2 ring-inset ring-ink",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[12px] tabular-nums",
                      isToday ? "bg-night font-semibold text-white" : list.length ? "font-semibold text-ink" : "text-ink-subtle",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {/* Phones: dots. Laptops: the first two events. */}
                  {list.length > 0 && (
                    <span className="flex gap-1 px-0.5 md:hidden" aria-hidden>
                      {list.slice(0, 3).map((e) => (
                        <span key={e.id} className={cn("size-1.5 rounded-full", yours(e) ? "bg-ink" : "ring-1 ring-inset ring-ink-subtle")} />
                      ))}
                    </span>
                  )}
                  <span className="hidden w-full flex-col gap-1 md:flex" aria-hidden>
                    {list.slice(0, 2).map((e) => (
                      <span key={e.id} className={cn("truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-medium leading-tight", pill(e))}>
                        {e.title}
                      </span>
                    ))}
                    {list.length > 2 && <span className="px-1.5 text-[11.5px] font-medium text-ink-subtle">+{list.length - 2} more</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {signedIn && (
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-subtle">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ink" aria-hidden /> Yours: going, waitlist or hosting
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full ring-1 ring-inset ring-ink-subtle" aria-hidden /> Other events
            </span>
          </p>
        )}
      </div>

      {/* The picked day. */}
      <aside aria-live="polite" aria-label={`Events on ${dayLabel(selected)}`} className="card min-w-0 self-start p-5">
        <p className="text-[13px] font-semibold text-ink-muted">{selected === data.today ? "Today" : "Picked day"}</p>
        <h3 className="mt-0.5 text-[18px] font-semibold text-ink">{dayLabel(selected)}</h3>
        {dayEvents.length === 0 ? (
          <p className="mt-3 text-[14.5px] text-ink-muted">Nothing on this day{onlyMine ? " for you" : ""}.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {dayEvents.map((e) => {
              const t = tag(e);
              return (
                <li key={e.id} className="py-3">
                  <p className="flex items-center justify-between gap-2 text-[13px] tabular-nums text-ink-muted">
                    <span>{time(e.startsAt)}</span>
                    {t && <Chip tone={t[1]}>{t[0]}</Chip>}
                  </p>
                  {signedIn ? (
                    <Link href={e.hosting ? `/organizer/events/${e.id}` : `/events/${e.slug}`} className="mt-1 block text-[15.5px] font-semibold text-ink underline-offset-4 hover:underline">
                      {e.title}
                    </Link>
                  ) : (
                    <p className="mt-1 text-[15.5px] font-semibold text-ink">{e.title}</p>
                  )}
                  <p className="truncate text-[13.5px] text-ink-muted">{e.venue}</p>
                </li>
              );
            })}
          </ul>
        )}
        {!signedIn && dayEvents.length > 0 && (
          <Link href="/signin?mode=signup" className={buttonClass("accent", "md", "mt-4 w-full")}>
            Sign up to register
          </Link>
        )}
      </aside>
    </div>
  );
}
