"use client";

import Link from "next/link";
import { istTime, isSoldOut, seatsLabel, ticketDate, type CalendarEvent } from "@/lib/organizer/shared";

export interface RailClash {
  eventId: string;
  title: string;
  other: string;
  venue: string | null;
  severity: string;
}
export interface RailDraft {
  id: string;
  title: string;
  starts_at: string;
  missing: string[];
}

export function Rail(props: { events: CalendarEvent[]; clashes: RailClash[]; drafts: RailDraft[]; week: CalendarEvent[]; onFilter: (f: "all" | "published" | "draft") => void; onSoldOut: () => void }) {
  const { events, clashes, drafts, week, onFilter, onSoldOut } = props;
  const published = events.filter((e) => e.status !== "draft").length;
  const next = events.find((e) => e.status !== "draft" && Date.parse(e.ends_at) > Date.now());
  const dateOf = (id: string) => events.find((e) => e.id === id)?.starts_at;

  return (
    <aside className="o-rail" aria-label="Needs attention">
      <h2 className="o-rail-title">Needs attention</h2>
      {clashes.length > 0 && (
        <section>
          <h3>Clashes</h3>
          {clashes.map((c, i) => {
            const at = dateOf(c.eventId);
            return (
              <Link key={i} className="o-rail-row" href={`/organizer/events/${c.eventId}`}>
                <span className="o-clash">! </span>
                {c.title} and {c.other}
                <span className="o-rail-sub">
                  {at ? `${ticketDate(at)} · ` : ""}
                  {c.venue}
                </span>
                <span className="o-rail-go">Resolve →</span>
              </Link>
            );
          })}
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
                {ticketDate(e.starts_at).slice(0, 3)} {istTime(new Date(e.starts_at))} · {seatsLabel(e)}
              </span>
            </Link>
          ))}
        </section>
      )}
      <section>
        <h3>Month at a glance</h3>
        <button className="o-rail-row o-kv" onClick={() => onFilter("all")}>
          <span>Events</span>
          <span className="o-mono">{events.length}</span>
        </button>
        <button className="o-rail-row o-kv" onClick={() => onFilter("published")}>
          <span>Published</span>
          <span className="o-mono">{published}</span>
        </button>
        <button className="o-rail-row o-kv" onClick={() => onFilter("draft")}>
          <span>Drafts</span>
          <span className="o-mono">{events.length - published}</span>
        </button>
        <button className="o-rail-row o-kv" onClick={onSoldOut}>
          <span>Sold out</span>
          <span className="o-mono">{events.filter(isSoldOut).length}</span>
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
  );
}
