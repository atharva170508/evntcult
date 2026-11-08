"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Segmented, Toast, apiJson, type ToastState } from "./primitives";
import { dayKey, isMultiDay, istTime, layoutMonth, ticketDate, type CalendarEvent } from "@/lib/organizer/shared";

interface Props {
  month: string;
  today: string;
  events: CalendarEvent[];
  clashes: { eventId: string; title: string; other: string; venue: string | null; severity: string }[];
  drafts: { id: string; title: string; starts_at: string; missing: string[] }[];
  week: CalendarEvent[];
}

type Filter = "all" | "published" | "draft";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const seats = (e: CalendarEvent) => (e.capacity === null ? `${e.taken} going` : `${e.taken} / ${e.capacity}`);
const soldOut = (e: CalendarEvent) => e.capacity !== null && e.taken >= e.capacity;
const isLive = (e: CalendarEvent) => e.status === "published" && Date.parse(e.starts_at) <= Date.now() && Date.parse(e.ends_at) > Date.now();

function Chip({ e, onDrag }: { e: CalendarEvent; onDrag: (ev: CalendarEvent) => void }) {
  return (
    <Link href={`/organizer/events/${e.id}`} className={`o-ev ${e.status === "draft" ? "draft" : ""}`} draggable onDragStart={() => onDrag(e)} title={e.title}>
      <span className="o-ev-time">
        {isLive(e) && <span className="o-dot" aria-label="Live now" />}
        {istTime(new Date(e.starts_at))}
        {e.clash && (
          <span className="o-clash" aria-label="Clash">
            !
          </span>
        )}
      </span>
      <span className="o-ev-title" style={{ display: "block" }}>
        {e.title}
      </span>
    </Link>
  );
}

export function CalendarView({ month, today, events, clashes, drafts, week }: Props) {
  const router = useRouter();
  const [y, m] = month.split("-").map(Number);
  const [filter, setFilter] = useState<Filter>("all");
  const [venue, setVenue] = useState("");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"month" | "agenda">(() => (events.length < 12 ? "agenda" : "month"));
  const [narrow, setNarrow] = useState(false);
  const [popover, setPopover] = useState<{ date: string; items: CalendarEvent[]; x: number; y: number } | null>(null);
  const [overCell, setOverCell] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const dragging = useRef<CalendarEvent | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Restore the view and filters when the month changes.
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem("o-cal") ?? "null");
      if (s) {
        setFilter(s.filter);
        setVenue(s.venue);
        setView(s.view);
      }
    } catch {}
  }, []);
  const restored = useRef(false);
  useEffect(() => {
    // The first run still has the defaults; saving them would wipe what was just restored.
    if (!restored.current) {
      restored.current = true;
      return;
    }
    try {
      sessionStorage.setItem("o-cal", JSON.stringify({ filter, venue, view }));
    } catch {}
  }, [filter, venue, view]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    router.push(`/organizer/calendar?m=${d.toISOString().slice(0, 7)}`);
  };
  const goToday = () => router.push(`/organizer/calendar?m=${today.slice(0, 7)}`);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|SELECT|TEXTAREA/.test(t.tagName)) return;
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key.toLowerCase() === "t") goToday();
      else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") setPopover(null);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

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

  const showAgenda = narrow || view === "agenda";
  const byDay = useMemo(() => {
    const single = shown.filter((e) => !isMultiDay(e));
    const days = new Map<string, CalendarEvent[]>();
    for (const e of single) {
      const k = dayKey(e.starts_at);
      if (k.startsWith(month)) days.set(k, [...(days.get(k) ?? []), e]);
    }
    return [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shown, month]);
  const multi = shown.filter(isMultiDay);
  const next = events.find((e) => e.status !== "draft" && Date.parse(e.ends_at) > Date.now());

  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <b>Calendar</b>
        </div>
        <input ref={searchRef} aria-label="Search events" className="o-input" style={{ height: 26, maxWidth: 220, fontSize: 12 }} placeholder="Search  /" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="o-spacer" />
        <Link className="o-btn o-btn-primary" href="/organizer/events/new">
          Create event
        </Link>
      </header>
      <div className="o-page">
        <div className="o-cal">
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div className="o-cal-title">
                  {MONTHS[m - 1]} <span>{y}</span>
                </div>
                <div className="o-meta" style={{ fontSize: 10, color: "var(--dim)", marginTop: 5 }}>
                  {events.length} events · {draftCount} drafts · times in IST
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
                  onChange={setView}
                />
              )}
            </div>

            <div className="o-inline" style={{ margin: "14px 0", flexWrap: "wrap" }}>
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
              <div>
                {shown.length === 0 && <p className="o-meta" style={{ borderTop: "1px solid var(--hair)", paddingTop: 14 }}>Nothing this month.</p>}
                {multi.map((e) => (
                  <div key={e.id} style={{ borderTop: "1px solid var(--hair)", padding: "10px 0" }}>
                    <Link href={`/organizer/events/${e.id}`} className="o-agenda-bar">
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.title.toUpperCase()} · {Math.round((Date.parse(e.ends_at) - Date.parse(e.starts_at)) / 86_400_000) || 1} days{e.venue ? ` · ${e.venue}` : ""}
                      </span>
                      <span className="o-mono" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                        {ticketDate(e.starts_at).slice(4)} to {ticketDate(new Date(Date.parse(e.ends_at) - 1).toISOString()).slice(4)}
                      </span>
                    </Link>
                  </div>
                ))}
                {byDay.map(([date, list]) => {
                  const label = ticketDate(`${date}T12:00:00+05:30`);
                  return (
                    <div className="o-agenda-day" key={date}>
                      <div>
                        <div className={`o-agenda-wd ${date === today ? "today" : ""}`}>{label.slice(0, 3)}</div>
                        <div className="o-agenda-num">{Number(date.slice(8))}</div>
                      </div>
                      <div>
                        {list.map((e) => (
                          <Link key={e.id} href={`/organizer/events/${e.id}`} className="o-agenda-row">
                            <span className="o-agenda-time">
                              {isLive(e) && <span className="o-dot" aria-label="Live now" />}
                              {istTime(new Date(e.starts_at))}
                            </span>
                            <span className={`t ${e.status === "draft" ? "d" : ""}`}>
                              {e.title} {e.clash && <span className="o-clash">!</span>}
                            </span>
                            <span className="o-agenda-venue">{e.venue ?? "TBA"}</span>
                            <span className="o-agenda-cap" style={soldOut(e) ? { color: "var(--warn)" } : undefined}>
                              {e.status === "draft" ? <span className="o-pill">DRAFT</span> : seats(e)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="o-grid" role="grid" aria-label={`${MONTHS[m - 1]} ${y}`}>
                <div className="o-dow">
                  {DOW.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                {weeks.map((w, i) => (
                  <div className="o-week" key={i}>
                    {w.cells.map((c) => {
                      const hasBar = w.bars.some((b) => w.cells.indexOf(c) >= b.startCol && w.cells.indexOf(c) < b.startCol + b.span);
                      return (
                        <div
                          key={c.date}
                          role="gridcell"
                          className={`o-cell ${c.inMonth ? "" : "out"} ${overCell === c.date ? "drop" : ""}`}
                          onDragOver={(e) => {
                            if (!c.inMonth) return;
                            e.preventDefault();
                            setOverCell(c.date);
                          }}
                          onDragLeave={() => setOverCell((x) => (x === c.date ? null : x))}
                          onDrop={() => void drop(c.date)}
                        >
                          <div className={`o-daynum ${c.date === today ? "today" : ""}`}>{c.day}</div>
                          <div style={hasBar ? { marginTop: -2 } : undefined}>
                            {c.chips.slice(0, hasBar ? 1 : 2).map((e) => (
                              <Chip key={e.id} e={e} onDrag={(x) => (dragging.current = x)} />
                            ))}
                            {(() => {
                              const more = c.more + (hasBar ? Math.max(0, c.chips.length - 1) : 0);
                              return more > 0 ? (
                                <button className="o-more" onClick={(ev) => setPopover({ date: c.date, items: c.all, x: Math.min(ev.clientX, window.innerWidth - 280), y: Math.min(ev.clientY, window.innerHeight - 260) })}>
                                  +{more} more
                                </button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      );
                    })}
                    {w.bars.map((b) => (
                      <Link
                        key={b.event.id}
                        href={`/organizer/events/${b.event.id}`}
                        className="o-bar"
                        style={{ left: `calc(${(b.startCol / 7) * 100}% + 26px)`, width: `calc(${(b.span / 7) * 100}% - 30px)` }}
                        aria-label={b.event.title}
                      >
                        {b.continuation ? "" : b.event.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="o-rail" aria-label="This month">
            {clashes.length > 0 && (
              <section>
                <h3>Clashes</h3>
                {clashes.map((c, i) => (
                  <Link key={i} className="o-rail-row" href={`/organizer/events/${c.eventId}`}>
                    <span className="o-clash">! </span>
                    {c.title} and {c.other}
                    <span className="o-rail-sub">{c.venue}</span>
                    <span className="o-rail-go">Resolve →</span>
                  </Link>
                ))}
              </section>
            )}
            {drafts.length > 0 && (
              <section>
                <h3>Drafts</h3>
                {drafts.map((d) => (
                  <Link key={d.id} className="o-rail-row" href={`/organizer/events/${d.id}`}>
                    ○ {d.title}
                    <span className="o-rail-sub">
                      {ticketDate(d.starts_at)}
                      {d.missing.length ? ` · needs ${d.missing.join(", ")}` : " · ready"}
                    </span>
                    <span className="o-rail-go">Finish setup →</span>
                  </Link>
                ))}
              </section>
            )}
            {week.length > 0 && (
              <section>
                <h3>This week</h3>
                {week.map((e) => (
                  <Link key={e.id} className="o-rail-row" href={`/organizer/events/${e.id}`}>
                    {e.title}
                    <span className="o-rail-sub">
                      {ticketDate(e.starts_at).slice(0, 3)} {istTime(new Date(e.starts_at))} · {seats(e)}
                    </span>
                  </Link>
                ))}
              </section>
            )}
            <section>
              <h3>Month at a glance</h3>
              <button className="o-rail-row o-kv" onClick={() => setFilter("all")}>
                <span>Events</span>
                <span className="o-mono">{events.length}</span>
              </button>
              <button className="o-rail-row o-kv" onClick={() => setFilter("published")}>
                <span>Published</span>
                <span className="o-mono">{published}</span>
              </button>
              <button className="o-rail-row o-kv" onClick={() => setFilter("draft")}>
                <span>Drafts</span>
                <span className="o-mono">{draftCount}</span>
              </button>
              <button
                className="o-rail-row o-kv"
                onClick={() => {
                  setFilter("published");
                  setView("agenda");
                }}
              >
                <span>Sold out</span>
                <span className="o-mono">{events.filter(soldOut).length}</span>
              </button>
              {next && (
                <Link className="o-rail-row o-kv" href={`/organizer/events/${next.id}`}>
                  <span>Next</span>
                  <span className="o-mono" style={{ fontSize: 11 }}>
                    {next.title.slice(0, 22)}
                  </span>
                </Link>
              )}
            </section>
          </aside>
        </div>
      </div>

      {popover && (
        <div className="o-pop" role="dialog" aria-label={`Events on ${popover.date}`} style={{ left: popover.x, top: popover.y }}>
          <div className="o-inline" style={{ justifyContent: "space-between", marginBottom: 6 }}>
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
