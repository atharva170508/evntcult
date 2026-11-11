"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Segmented, Toast, apiJson, type ToastState } from "./primitives";
import { Agenda } from "./Agenda";
import { MonthGrid } from "./MonthGrid";
import { Rail, type RailClash, type RailDraft } from "./Rail";
import { dayKey, isMultiDay, istTime, layoutMonth, ticketDate, type CalendarEvent } from "@/lib/organizer/shared";

interface Props {
  initialView: "month" | "agenda" | null;
  month: string;
  today: string;
  initials: string;
  events: CalendarEvent[];
  clashes: RailClash[];
  drafts: RailDraft[];
  week: CalendarEvent[];
}

type Filter = "all" | "published" | "draft";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_MOVES: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

function addDay(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Does this event run on this calendar day (IST)? */
const onDay = (e: CalendarEvent, date: string) => dayKey(e.starts_at) <= date && dayKey(new Date(Date.parse(e.ends_at) - 1).toISOString()) >= date;

export function CalendarView({ initialView, month, today, initials, events, clashes, drafts, week }: Props) {
  const router = useRouter();
  const [y, m] = month.split("-").map(Number);
  const [filter, setFilter] = useState<Filter>("all");
  const [venue, setVenue] = useState("");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"month" | "agenda">(() => initialView ?? (events.length < 12 ? "agenda" : "month"));
  const [loading, startNav] = useTransition();
  const [narrow, setNarrow] = useState(false);
  const [popover, setPopover] = useState<{ date: string; items: CalendarEvent[]; x: number; y: number } | null>(null);
  const [overCell, setOverCell] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const dragging = useRef<CalendarEvent | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const openMonth = (target: string) => {
    setPopover(null);
    if (target !== month) startNav(() => router.push(`/organizer/calendar?m=${target}&v=${view}`));
  };
  const go = (delta: number) => {
    setCursor(null);
    openMonth(new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7));
  };
  const goToday = () => {
    setCursor(today);
    openMonth(today.slice(0, 7));
  };
  const pickView = (v: "month" | "agenda") => {
    setView(v);
    window.history.replaceState(null, "", `/organizer/calendar?m=${month}&v=${v}`);
  };

  const venues = useMemo(() => [...new Set(events.map((e) => e.venue).filter(Boolean) as string[])].sort(), [events]);
  const shown = useMemo(
    () =>
      events.filter(
        (e) =>
          (filter === "all" || (filter === "draft" ? e.status === "draft" : e.status !== "draft")) &&
          (!venue || e.venue === venue) &&
          (!q.trim() || e.title.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [events, filter, venue, q],
  );
  const published = events.filter((e) => e.status !== "draft").length;
  const draftCount = events.length - published;
  const weeks = useMemo(() => layoutMonth(y, m - 1, shown), [y, m, shown]);
  const showAgenda = narrow || view === "agenda";
  const byDay = useMemo(() => {
    const days = new Map<string, CalendarEvent[]>();
    for (const e of shown.filter((x) => !isMultiDay(x))) {
      const k = dayKey(e.starts_at);
      if (k.startsWith(month)) days.set(k, [...(days.get(k) ?? []), e]);
    }
    return [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shown, month]);
  const multi = shown.filter(isMultiDay);

  useEffect(() => {
    const moveCursor = (key: string) => {
      if (showAgenda) {
        const dates = byDay.map(([d]) => d);
        if (dates.length === 0) return;
        if (!cursor || !dates.includes(cursor)) return setCursor(dates.find((d) => d >= today) ?? dates[0]);
        const next = dates[dates.indexOf(cursor) + (key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1)];
        if (next) setCursor(next);
        return;
      }
      if (!cursor) return setCursor(today.startsWith(month) ? today : `${month}-01`);
      const next = addDay(cursor, DAY_MOVES[key]);
      setCursor(next);
      if (!next.startsWith(month)) openMonth(next.slice(0, 7));
    };

    const openCursor = () => {
      if (!cursor) return;
      const items = showAgenda ? (byDay.find(([d]) => d === cursor)?.[1] ?? []) : shown.filter((e) => onDay(e, cursor));
      if (items.length === 1) router.push(`/organizer/events/${items[0].id}`);
      else if (items.length > 1) {
        const box = document.querySelector(`[data-date="${cursor}"]`)?.getBoundingClientRect();
        setPopover({ date: cursor, items, x: Math.min(box?.left ?? 200, window.innerWidth - 280), y: Math.min(box?.bottom ?? 200, window.innerHeight - 260) });
      }
    };

    const on = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (/INPUT|SELECT|TEXTAREA/.test(t.tagName)) return;
      if (e.key in DAY_MOVES) {
        e.preventDefault();
        moveCursor(e.key);
      } else if (e.key === "Enter") {
        if (/^(A|BUTTON)$/.test(t.tagName)) return; // let the focused control do its own thing
        openCursor();
      } else if (e.key.toLowerCase() === "t") goToday();
      else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") setPopover(null);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, view, narrow, cursor, shown, byDay, showAgenda]);

  async function move(e: CalendarEvent, date: string, version: number): Promise<number | null> {
    const r = await apiJson<{ version: number }>(`/api/events/${e.id}`, "PATCH", { version, date });
    if (!r.ok) {
      setToast({ message: r.data.error?.message.replace(/^[a-zA-Z]+: /, "") ?? "Couldn't move it." });
      return null;
    }
    router.refresh();
    return r.data.version;
  }

  async function drop(date: string) {
    const e = dragging.current;
    dragging.current = null;
    setOverCell(null);
    if (!e) return;
    const from = dayKey(e.starts_at);
    if (from === date) return;
    const v = await move(e, date, e.version);
    if (v !== null) setToast({ message: `Moved to ${ticketDate(`${date}T12:00:00+05:30`)}`, action: { label: "Undo", run: () => void move(e, from, v) } });
  }

  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <b>Calendar</b>
        </div>
        <input ref={searchRef} aria-label="Search events" className="o-input text-label" style={{ height: 26, maxWidth: 220 }} placeholder="Search  /" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="o-spacer" />
        <Link className="o-btn o-btn-primary" href="/organizer/events/new">
          New event
        </Link>
        <Link className="o-avatar" href="/profile" aria-label="Your profile">
          {initials}
        </Link>
      </header>
      <div className="o-page">
        <div className="o-cal">
          <div>
            <div className="flex items-start gap-3 flex-wrap">
              <div>
                <h1 className="o-cal-title">
                  {MONTHS[m - 1]} <span>{y}</span>
                </h1>
                <div className="o-meta text-caption text-ink-subtle mt-1" style={{ height: 14 }}>
                  {loading ? <span className="o-skel" /> : `${events.length} events · ${draftCount} drafts · times in IST`}
                </div>
              </div>
              <span className="o-spacer" />
              <Button onClick={goToday}>Today</Button>
              <Button aria-label="Previous month" onClick={() => go(-1)}>
                ‹
              </Button>
              <Button aria-label="Next month" onClick={() => go(1)}>
                ›
              </Button>
              {!narrow && (
                <Segmented
                  label="View"
                  value={view}
                  options={[
                    ["month", "Month"],
                    ["agenda", "Agenda"],
                  ]}
                  onChange={pickView}
                />
              )}
            </div>

            <div className="o-inline my-4 flex-wrap">
              {(
                [
                  ["all", `All ${events.length}`],
                  ["published", `Published ${published}`],
                  ["draft", `Drafts ${draftCount}`],
                ] as const
              ).map(([v, l]) => (
                <button key={v} className="o-filter" aria-pressed={filter === v} onClick={() => setFilter(v)}>
                  {l}
                </button>
              ))}
              <select aria-label="Venue" className="o-select" value={venue} onChange={(e) => setVenue(e.target.value)}>
                <option value="">All venues</option>
                {venues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {showAgenda ? (
              <Agenda multi={multi} byDay={byDay} today={today} cursor={cursor} empty={shown.length === 0} />
            ) : (
              <MonthGrid
                label={`${MONTHS[m - 1]} ${y}`}
                weeks={weeks}
                today={today}
                cursor={cursor}
                overCell={overCell}
                onDrag={(e) => (dragging.current = e)}
                onOver={setOverCell}
                onDrop={(d) => void drop(d)}
                onMore={(c, x, py) => setPopover({ date: c.date, items: c.all, x: Math.min(x, window.innerWidth - 280), y: Math.min(py, window.innerHeight - 260) })}
              />
            )}
          </div>

          <Rail
            events={events}
            clashes={clashes}
            drafts={drafts}
            week={week}
            onFilter={setFilter}
            onSoldOut={() => {
              setFilter("published");
              pickView("agenda");
            }}
          />
        </div>
      </div>

      {popover && (
        <div className="o-pop" role="dialog" aria-label={`Events on ${popover.date}`} style={{ left: popover.x, top: popover.y }}>
          <div className="o-inline justify-between mb-2">
            <span className="o-meta">{ticketDate(`${popover.date}T12:00:00+05:30`)}</span>
            <button className="o-link" onClick={() => setPopover(null)}>
              Close
            </button>
          </div>
          {popover.items.map((e) => (
            <Link key={e.id} href={`/organizer/events/${e.id}`}>
              <span className="o-meta">{istTime(new Date(e.starts_at))}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
            </Link>
          ))}
        </div>
      )}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
