"use client";

import Link from "next/link";
import { istTime, isLiveNow, isSoldOut, seatsLabel, spanDays, spanRange, ticketDate, type CalendarEvent } from "@/lib/organizer/shared";

export function Agenda({ multi, byDay, today, cursor, empty }: { multi: CalendarEvent[]; byDay: [string, CalendarEvent[]][]; today: string; cursor: string | null; empty: boolean }) {
  return (
    <div>
      {empty && (
        <p className="o-meta" style={{ borderTop: "1px solid var(--hair)", paddingTop: 14 }}>
          Nothing this month.
        </p>
      )}
      {multi.map((e) => (
        <div key={e.id} style={{ borderTop: "1px solid var(--hair)", padding: "10px 0" }}>
          <Link href={`/organizer/events/${e.id}`} className="o-agenda-bar">
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {e.title.toUpperCase()} · {spanDays(e)} days{e.venue ? ` · ${e.venue}` : ""}
            </span>
            <span className="o-mono" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
              {spanRange(e)}
            </span>
          </Link>
        </div>
      ))}
      {byDay.map(([date, list]) => (
        <div className="o-agenda-day" key={date} data-date={date}>
          <div>
            <div className={`o-agenda-wd ${date === today ? "today" : ""}`}>{ticketDate(`${date}T12:00:00+05:30`).slice(0, 3)}</div>
            <div className="o-agenda-num">{Number(date.slice(8))}</div>
          </div>
          <div>
            {list.map((e, i) => (
              <Link key={e.id} href={`/organizer/events/${e.id}`} className={`o-agenda-row ${date === cursor && i === 0 ? "selected" : ""}`}>
                <span className="o-agenda-time">
                  {isLiveNow(e) && <span className="o-dot" aria-label="Live now" />}
                  {istTime(new Date(e.starts_at))}
                </span>
                <span className={`t ${e.status === "draft" ? "d" : ""}`}>
                  {e.title} {e.clash && <span className="o-clash">!</span>}
                </span>
                <span className="o-agenda-venue">{e.venue ?? "TBA"}</span>
                <span className="o-agenda-cap" style={isSoldOut(e) ? { color: "var(--warn)" } : undefined}>
                  {e.status === "draft" ? <span className="o-pill">DRAFT</span> : seatsLabel(e)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
