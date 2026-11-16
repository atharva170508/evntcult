import type { Metadata } from "next";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { organizerEvents, type HomeEvent } from "@/lib/data/organizer-events";
import { MISSING_LABEL, istTime, missingForPublish, ticketDate } from "@/lib/organizer/shared";
import { DuplicateButton } from "@/components/organizer-ui/EventActions";

export const metadata: Metadata = { title: "Your events" };
export const dynamic = "force-dynamic";

function Seats({ e }: { e: HomeEvent }) {
  return <span className="o-meta">{e.capacity === null ? `${e.taken} going` : `${e.taken} / ${e.capacity}`}</span>;
}

function Row({ e, draft }: { e: HomeEvent; draft?: boolean }) {
  const missing = draft ? missingForPublish(e).map((m) => MISSING_LABEL[m]) : [];
  return (
    <div className="o-list-row">
      <span className="o-meta o-hide-sm">
        {ticketDate(e.starts_at)}
        <br />
        {istTime(new Date(e.starts_at))}
      </span>
      <Link href={`/organizer/events/${e.id}`} className="o-t">
        {e.title}
      </Link>
      <span className="o-meta o-hide-sm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {draft ? (missing.length ? `needs ${missing.join(", ")}` : "") : e.venue_status === "tba" ? "Venue TBA" : e.venue}
      </span>
      <span className="o-hide-sm">{draft ? <span className="o-pill">DRAFT</span> : <Seats e={e} />}</span>
      <div className="o-actions">
        <DuplicateButton id={e.id} />
        {draft ? (
          <Link className="o-btn" href={`/organizer/events/${e.id}`}>
            Finish setup
          </Link>
        ) : (
          <Link className="o-btn" href={`/organizer/events/${e.id}/manage`}>
            Attendees
          </Link>
        )}
      </div>
    </div>
  );
}

function List({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="o-list-head">
        <span className="o-section-label">{title}</span>
        <span className="o-meta">{count}</span>
      </div>
      {children}
    </section>
  );
}

export default async function OrganizerHome() {
  const viewer = (await getViewer())!;
  const db = await getDB();
  const events = await organizerEvents(db, viewer.id);
  const money = await db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN e.price_paise END), 0) AS collected,
              COALESCE(SUM(CASE WHEN r.payment_status = 'unpaid' AND r.upi_utr IS NOT NULL THEN e.price_paise END), 0) AS to_verify
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.organizer_id = ? AND r.status = 'registered' AND e.price_paise > 0`,
    )
    .bind(viewer.id)
    .first<{ collected: number; to_verify: number }>();
  const nowIso = new Date().toISOString();
  const drafts = events.filter((e) => e.status === "draft");
  const upcoming = events.filter((e) => e.status === "published" && e.ends_at > nowIso);
  const past = events.filter((e) => e.status !== "draft" && !upcoming.includes(e)).reverse().slice(0, 12);

  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <b>Events</b>
        </div>
        <span className="o-spacer" />
        <Link className="o-btn" href="/organizer/calendar">
          Calendar
        </Link>
        <Link className="o-btn o-btn-primary" href="/organizer/events/new">
          Create event
        </Link>
      </header>
      <div className="o-page" style={{ maxWidth: 1100 }}>
        <h1 className="o-title">Your events</h1>
        {money && money.collected + money.to_verify > 0 && (
          <p className="o-meta" style={{ marginTop: 6 }}>
            Collected {money.collected ? formatINR(money.collected) : "₹0"}
            {money.to_verify > 0 && ` · To verify ${formatINR(money.to_verify)}`}
          </p>
        )}
        {events.length === 0 ? (
          <div style={{ borderTop: "1px solid var(--hair)", marginTop: 24, paddingTop: 18 }}>
            <p style={{ fontSize: 15, margin: "0 0 12px" }}>No events yet.</p>
            <Link className="o-btn o-btn-primary" href="/organizer/events/new">
              Create event
            </Link>
          </div>
        ) : (
          <>
            {drafts.length > 0 && (
              <List title="Drafts" count={drafts.length}>
                {drafts.map((e) => (
                  <Row key={e.id} e={e} draft />
                ))}
              </List>
            )}
            <List title="Upcoming" count={upcoming.length}>
              {upcoming.length === 0 && <p className="o-meta" style={{ borderTop: "1px solid var(--hair-2)", paddingTop: 11 }}>Nothing published yet.</p>}
              {upcoming.map((e) => (
                <Row key={e.id} e={e} />
              ))}
            </List>
            {past.length > 0 && (
              <List title="Past" count={past.length}>
                {past.map((e) => (
                  <Row key={e.id} e={e} />
                ))}
              </List>
            )}
          </>
        )}
      </div>
    </>
  );
}
