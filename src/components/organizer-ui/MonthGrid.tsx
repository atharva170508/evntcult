"use client";

import Link from "next/link";
import { istTime, isLiveNow, spanDays, type CalendarEvent, type MonthCell, type MonthWeek } from "@/lib/organizer/shared";

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function Chip({ e, selected, onDrag }: { e: CalendarEvent; selected: boolean; onDrag: (ev: CalendarEvent) => void }) {
  return (
    <Link href={`/organizer/events/${e.id}`} className={`o-ev ${e.status === "draft" ? "draft" : ""} ${selected ? "selected" : ""}`} draggable onDragStart={() => onDrag(e)} title={e.title}>
      <span className="o-ev-time">
        {isLiveNow(e) && <span className="o-dot" aria-label="Live now" />}
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

interface CellProps {
  cell: MonthCell;
  hasBar: boolean;
  today: string;
  cursor: string | null;
  dropping: boolean;
  onDrag: (e: CalendarEvent) => void;
  onOver: (date: string | null) => void;
  onDrop: (date: string) => void;
  onMore: (cell: MonthCell, x: number, y: number) => void;
}

function DayCell({ cell: c, hasBar, today, cursor, dropping, onDrag, onOver, onDrop, onMore }: CellProps) {
  const visible = c.chips.slice(0, hasBar ? 1 : 2);
  const more = c.more + (hasBar ? Math.max(0, c.chips.length - 1) : 0);
  const isCursor = c.date === cursor;
  return (
    <div
      data-date={c.date}
      role="gridcell"
      aria-selected={isCursor}
      className={`o-cell ${c.inMonth ? "" : "out"} ${dropping ? "drop" : ""}`}
      onDragOver={(e) => {
        if (!c.inMonth) return;
        e.preventDefault();
        onOver(c.date);
      }}
      onDragLeave={() => onOver(null)}
      onDrop={() => onDrop(c.date)}
    >
      <div className={`o-daynum ${c.date === today ? "today" : ""} ${isCursor ? "cursor" : ""}`}>{c.day}</div>
      <div style={hasBar ? { marginTop: -2 } : undefined}>
        {visible.map((e, i) => (
          <Chip key={e.id} e={e} selected={isCursor && i === 0} onDrag={onDrag} />
        ))}
        {more > 0 && (
          <button className="o-more" onClick={(ev) => onMore(c, ev.clientX, ev.clientY)}>
            +{more} more
          </button>
        )}
      </div>
    </div>
  );
}

export function MonthGrid(props: { label: string; weeks: MonthWeek[]; overCell: string | null } & Omit<CellProps, "cell" | "hasBar" | "dropping">) {
  const { label, weeks, overCell, ...cell } = props;
  return (
    <div className="o-grid" role="grid" aria-label={label}>
      <div className="o-dow">
        {DOW.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      {weeks.map((w, i) => (
        <div className="o-week" key={i}>
          {w.cells.map((c, col) => (
            <DayCell key={c.date} {...cell} cell={c} dropping={overCell === c.date} hasBar={w.bars.some((b) => col >= b.startCol && col < b.startCol + b.span)} />
          ))}
          {w.bars.map((b) => (
            <Link
              key={b.event.id}
              href={`/organizer/events/${b.event.id}`}
              className="o-bar"
              style={{ left: `calc(${(b.startCol / 7) * 100}% + 26px)`, width: `calc(${(b.span / 7) * 100}% - 30px)` }}
              aria-label={b.event.title}
            >
              {!b.continuation && (
                <>
                  {b.event.title}
                  <span className="o-bar-meta">
                    {spanDays(b.event)} days{b.event.venue ? ` · ${b.event.venue}` : ""}
                  </span>
                </>
              )}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
