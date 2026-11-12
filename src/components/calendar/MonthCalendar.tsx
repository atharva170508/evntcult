"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { MonthPayload } from "@/lib/data/calendar";
import { buttonClass } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const time = (iso: string) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date(iso));
const dayLabel = (d: string) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

type Ev = MonthPayload["events"][number];
const tag = (e: Ev) => (e.status === "cancelled" ? "Cancelled" : e.hosting ? (e.status === "draft" ? "Your draft" : "Hosting") : e.mine === "registered" ? "Going" : e.mine === "waitlisted" ? "Waitlist" : null);

/**
 * The interactive month calendar on the landing page and the dashboard.
 * Today = accent circle on the number (§9). Days with your events are bold with a filled dot; other events are a hollow dot.
 * Pick a day (click, or arrow keys then Enter) to see its events. ‹ › change month; Today jumps back.
 * Visitors see public events and are asked to sign up to open one.
 */
export function MonthCalendar({ initial, signedIn, className }: { initial: MonthPayload; signedIn: boolean; className?: string }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string>(() => (initial.cells.includes(initial.today) ? initial.today : (initial.events[0]?.day ?? initial.cells.find(Boolean)!)));
  const [onlyMine, setOnlyMine] = useState(false);
  const grid = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => (onlyMine ? data.events.filter((e) => e.mine || e.hosting) : data.events), [data.events, onlyMine]);
  const byDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of shown) m.set(e.day, [...(m.get(e.day) ?? []), e]);
    return m;
  }, [shown]);
  const days = data.cells.filter(Boolean) as string[];
  const dayEvents = byDay.get(selected) ?? [];
  const mineCount = data.events.filter((e) => e.mine || e.hosting).length;

  async function go(month: string) {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/calendar?month=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const next = (await res.json()) as MonthPayload;
      setData(next);
      setSelected(next.cells.includes(next.today) ? next.today : (next.events[0]?.day ?? (next.cells.find(Boolean) as string)));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  // Roving focus: one day is in the Tab order; arrows move between days (§15 keyboard).
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
    <section className={cn("grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]", className)} aria-label="Calendar">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-title" aria-live="polite">
            {data.label}
            {loading && <span className="ml-2 font-mono text-caption text-ink-subtle">loading…</span>}
          </p>
          <div className="flex items-center gap-1">
            {signedIn && mineCount > 0 && (
              <button type="button" aria-pressed={onlyMine} onClick={() => setOnlyMine((v) => !v)} className={buttonClass(onlyMine ? "secondary" : "ghost", "sm", onlyMine ? "font-semibold" : undefined)}>
                {onlyMine ? "Only mine" : "Show only mine"}
              </button>
            )}
            <button type="button" onClick={() => go(data.prev)} className={buttonClass("ghost", "sm", "w-8 px-0")} aria-label="Previous month">
              ‹
            </button>
            <button type="button" onClick={() => go(initial.key)} disabled={data.key === initial.key} className={buttonClass("ghost", "sm")}>
              Today
            </button>
            <button type="button" onClick={() => go(data.next)} className={buttonClass("ghost", "sm", "w-8 px-0")} aria-label="Next month">
              ›
            </button>
          </div>
        </div>

        {failed && (
          <p role="alert" className="mb-3 border-l-2 border-bad pl-3 text-body-sm">
            That month didn&apos;t load. Try again.
          </p>
        )}

        <div className="grid grid-cols-7 border-x border-t border-line" aria-hidden>
          {WEEKDAYS.map((d) => (
            <div key={d} className="border-r border-line px-2 py-1 font-mono text-caption uppercase text-ink-subtle last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div ref={grid} role="group" aria-label={`${data.label}. Use the arrow keys to move between days.`} onKeyDown={onKey} className={cn("grid grid-cols-7 border-l border-t border-line", loading && "opacity-60")}>
          {data.cells.map((day, i) => {
            if (!day) return <div key={`b${i}`} role="presentation" className="min-h-12 border-b border-r border-line bg-canvas md:min-h-[88px]" />;
            const list = byDay.get(day) ?? [];
            const mine = list.filter((e) => e.mine || e.hosting);
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
                  "flex min-h-12 min-w-0 flex-col items-start gap-1 border-b border-r border-line p-1 text-left transition-colors duration-micro md:min-h-[88px]",
                  isSel ? "bg-surface-3" : "bg-surface hover:bg-surface-2",
                  isSel && "outline outline-1 -outline-offset-1 outline-line-strong",
                )}
              >
                <span className={cn("grid size-6 place-items-center rounded-full font-mono text-caption tabular-nums", isToday ? "bg-accent text-accent-ink" : mine.length ? "font-semibold text-ink" : list.length ? "text-ink" : "text-ink-subtle")}>
                  {Number(day.slice(8))}
                </span>
                {/* Phones: dots. Laptops: the first event's name. */}
                {list.length > 0 && (
                  <span className="flex gap-1 px-1 md:hidden" aria-hidden>
                    {list.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("size-1.5 rounded-full", e.mine || e.hosting ? "bg-ink" : "border border-ink-subtle")} />
                    ))}
                  </span>
                )}
                <span className="hidden w-full flex-col gap-0.5 md:flex" aria-hidden>
                  {list.slice(0, 2).map((e) => (
                    <span key={e.id} className={cn("truncate rounded-sm px-1 text-caption leading-5", e.mine || e.hosting ? "bg-surface-2 font-semibold text-ink" : "text-ink-muted", e.status === "cancelled" && "line-through")}>
                      {e.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="px-1 font-mono text-caption text-ink-subtle">+{list.length - 2}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-caption text-ink-muted">
          {signedIn && <span>● yours (going, waitlist, hosting)</span>}
          <span>○ campus events</span>
        </p>
      </div>

      {/* The selected day. */}
      <aside aria-live="polite" aria-label={`Events on ${dayLabel(selected)}`} className="min-w-0">
        <p className="eyebrow">{selected === data.today ? "Today" : "Selected day"}</p>
        <h3 className="mt-1 text-title">{dayLabel(selected)}</h3>
        {dayEvents.length === 0 ? (
          <p className="mt-3 text-body-sm text-ink-muted">Nothing on this day{onlyMine ? " for you" : ""}.</p>
        ) : (
          <ul className="mt-3 border-t border-line">
            {dayEvents.map((e) => (
              <li key={e.id} className="border-b border-line py-3">
                <p className="flex items-center justify-between gap-2 font-mono text-label text-ink-muted">
                  <span>{time(e.startsAt)}</span>
                  {tag(e) && <Chip tone={e.status === "cancelled" ? "danger" : "neutral"}>{tag(e)}</Chip>}
                </p>
                {signedIn ? (
                  <Link href={e.hosting ? `/organizer/events/${e.id}` : `/events/${e.slug}`} className="mt-1 block min-h-6 py-0.5 text-body font-semibold hover:underline">
                    {e.title}
                  </Link>
                ) : (
                  <p className="mt-1 text-body font-semibold">{e.title}</p>
                )}
                <p className="truncate font-mono text-caption text-ink-subtle">{e.venue}</p>
              </li>
            ))}
          </ul>
        )}
        {!signedIn && (
          <Link href="/signin?mode=signup" className={buttonClass("secondary", "md", "mt-4 w-full")}>
            Sign up to register
          </Link>
        )}
      </aside>
    </section>
  );
}
