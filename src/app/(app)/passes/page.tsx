import { kindFor } from "@/lib/categories";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Award, CalendarPlus, ChevronRight, Star, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { all } from "@/lib/db";
import { passQrPayload } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { accentFor } from "@/lib/data/events";
import { EventArt, accentHex, accentInk } from "@/components/ui/EventArt";
import { PageHero } from "@/components/brand/PageHero";
import { SavePassButton } from "@/components/passes/SavePassButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { HoloPass } from "@/components/passes/HoloPass";
import { qrArtSvg } from "@/lib/qr-art";
import { directionsUrl } from "@/lib/organizer/shared";

export const metadata: Metadata = { title: "My passes" };


/** A short serial printed on the pass, derived from the pass code and event (FNV-1a). */
function serialFor(code: string, eventId: string) {
  let h = 0x811c9dc5;
  for (const ch of `${code}|${eventId}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const hex = h.toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}
export const dynamic = "force-dynamic";

interface PassRow {
  id: string;
  status: "registered" | "waitlisted";
  pass_code: string;
  pass_token: string;
  payment_status: "paid" | "unpaid";
  hold_expires_at: string | null;
  upi_utr: string | null;
  cert_id: string | null;
  organizer_upi_id: string | null;
  created_at: string;
  event_id: string;
  slug: string;
  title: string;
  category: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  price_paise: number;
  event_status: string;
  checked_in_at: string | null;
  waitlist_position: number | null;
  requires_approval: number | null;
  event_type: string;
  venue_place_id: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
}

export default async function PassesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/passes");

  const rows = await all<PassRow>(
    `SELECT r.id, r.status, r.pass_code, r.pass_token, r.payment_status, r.upi_utr, r.hold_expires_at, r.created_at, e.organizer_upi_id,
            e.id AS event_id, e.slug, e.title, e.category, COALESCE(e.venue, 'Venue TBA') AS venue, e.starts_at, e.ends_at, e.price_paise, e.status AS event_status,
            e.event_type, e.venue_place_id, e.venue_lat, e.venue_lng, e.requires_approval,
            (SELECT c.scanned_at FROM checkins c WHERE c.registration_id = r.id) AS checked_in_at,
            (SELECT ct.id FROM certificates ct WHERE ct.registration_id = r.id AND ct.revoked_at IS NULL ORDER BY ct.kind = 'participation' LIMIT 1) AS cert_id,
            CASE WHEN r.status = 'waitlisted' THEN
              (SELECT COUNT(*) FROM registrations w WHERE w.event_id = r.event_id AND w.status = 'waitlisted'
                  AND (w.created_at < r.created_at OR (w.created_at = r.created_at AND w.id <= r.id)))
            END AS waitlist_position
       FROM registrations r JOIN events e ON e.id = r.event_id
      WHERE r.user_id = ? AND r.status IN ('registered', 'waitlisted')
      ORDER BY e.starts_at`,
    viewer.id,
  );

  // Answers the gate and food counter care about (food, size, team), for the labels above the QR.
  const answerRows = await all<{ registration_id: string; label: string; value: string }>(
    `SELECT a.registration_id, q.label, a.value FROM registration_answers a
       JOIN event_questions q ON q.id = a.question_id
       JOIN registrations r ON r.id = a.registration_id
      WHERE r.user_id = ? AND r.status IN ('registered','waitlisted') AND (q.kind = 'choice' OR q.label LIKE '%team%' OR q.label LIKE '%jersey%')
      ORDER BY q.created_at`,
    viewer.id,
  );
  // Order by what this event's category puts first on a pass (team and track for a hackathon, team,
  // role and jersey for a tournament, pass type for a party), then keep four.
  const catOf = new Map(rows.map((r) => [r.id, r.category]));
  const byReg = new Map<string, { label: string; value: string }[]>();
  for (const a of answerRows) byReg.set(a.registration_id, [...(byReg.get(a.registration_id) ?? []), { label: a.label, value: a.value }]);
  const logistics = new Map<string, { label: string; value: string }[]>();
  for (const [reg, items] of byReg) {
    const order = kindFor(catOf.get(reg))?.passBadges ?? [];
    const rank = (l: string) => {
      const i = order.findIndex((o) => l.toLowerCase().includes(o));
      return i === -1 ? order.length : i;
    };
    logistics.set(reg, [...items].sort((x, y) => rank(x.label) - rank(y.label)).slice(0, 4));
  }

  // Partiful's "Interested": saved, not registered, still to come.
  const saved = await all<{ slug: string; title: string; event_id: string; category: string; starts_at: string; venue: string; price_paise: number; full: number }>(
    `SELECT e.slug, e.title, e.id AS event_id, e.category, e.starts_at, COALESCE(e.venue, 'Venue TBA') AS venue, e.price_paise,
            (e.capacity IS NOT NULL AND (SELECT COUNT(*) FROM registrations x WHERE x.event_id = e.id AND x.status = 'registered') >= e.capacity) AS full
       FROM event_saves s JOIN events e ON e.id = s.event_id
      WHERE s.user_id = ?1 AND e.status = 'published' AND e.ends_at > ?2
        AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status IN ('registered','waitlisted'))
      ORDER BY e.starts_at`,
    viewer.id,
    new Date().toISOString(),
  );

  const now = Date.now();
  const upcoming = rows.filter((r) => Date.parse(r.ends_at) > now);
  const past = rows.filter((r) => Date.parse(r.ends_at) <= now).reverse();

  const qr = new Map<string, string>();
  for (const r of upcoming) {
    if (r.status === "registered" && r.event_status !== "cancelled") {
      qr.set(r.id, await QRCode.toString(passQrPayload(r.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#222222", light: "#ffffff" } }));
    }
  }

  return (
    <div className="space-y-12 pb-8">
      <PageHero title="Passes" />

      {upcoming.length === 0 ? (
        <EmptyState icon={Ticket} title="No upcoming passes" action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <div className="grid justify-items-center gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((r) => {
            const starts = new Date(r.starts_at);
            const ends = new Date(r.ends_at);
            const cancelled = r.event_status === "cancelled";
            const qrSvg = qr.get(r.id) ?? null;
            const accent = accentFor({ id: r.event_id, category: r.category });
            const qrArt = qrSvg ? qrArtSvg(passQrPayload(r.pass_token), { ink: accentInk(accent), accent: accentHex(accent) }) : null;
            return (
              <div key={r.id} className="flex w-full flex-col items-center">
                <HoloPass
                  regId={r.id}
                  slug={r.slug}
                  title={r.title}
                  weekday={fmtDate(starts, { weekday: "short" })}
                  day={fmtDate(starts, { day: "numeric" })}
                  month={fmtDate(starts, { month: "short" })}
                  time={fmtTime(starts)}
                  timeRange={fmtRange(starts, ends)}
                  venue={r.venue}
                  holder={viewer.name}
                  passCode={r.pass_code}
                  serial={serialFor(r.pass_code, r.event_id)}
                  qrArt={qrArt}
                  accent={accent}
                  ink={accentInk(accent)}
                  seed={r.event_id}
                  state={cancelled ? "cancelled" : r.status === "waitlisted" ? "waitlist" : Date.parse(r.starts_at) <= now ? "live" : "confirmed"}
                  waitlistNote={
                    r.status === "waitlisted"
                      ? r.requires_approval
                        ? "Request sent. The host approves each guest; your pass appears here once they say yes."
                        : r.hold_expires_at
                        ? `A seat is held for you until ${fmtTime(new Date(r.hold_expires_at))}. Confirm it on the event page.`
                        : `On the waitlist${r.waitlist_position ? `, #${r.waitlist_position}` : ""}. If someone cancels, you'll get a seat to confirm.`
                      : null
                  }
                  pay={
                    r.status === "registered" && r.price_paise > 0
                      ? r.payment_status === "paid"
                        ? { text: "Paid", tone: "ok" }
                        : r.upi_utr
                          ? { text: "Payment being checked", tone: "warn" }
                          : r.organizer_upi_id
                            ? { text: `Pay ${formatINR(r.price_paise)} by UPI`, tone: "warn", href: `/events/${r.slug}#register` }
                            : { text: `${formatINR(r.price_paise)} at the desk`, tone: "warn" }
                      : null
                  }
                  admittedAt={r.checked_in_at ? fmtTime(new Date(r.checked_in_at)) : null}
                  startsAt={r.starts_at}
                  endsAt={r.ends_at}
                  directions={r.event_type !== "virtual" && r.venue !== "Venue TBA" ? directionsUrl({ venue: r.venue, venue_place_id: r.venue_place_id, venue_lat: r.venue_lat, venue_lng: r.venue_lng }) : null}
                  logistics={logistics.get(r.id) ?? []}
                />
                <div className="mt-3 flex w-full max-w-[360px] flex-wrap items-center justify-center gap-x-1 gap-y-1">
                  {r.status === "registered" && qrSvg && (
                    <SavePassButton
                      title={r.title}
                      dateLabel={fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}
                      timeLabel={fmtRange(starts, ends)}
                      venue={r.venue}
                      passCode={r.pass_code}
                      qrSvg={qrSvg}
                      className="h-10 border-0 bg-transparent px-3 text-[13.5px] hover:bg-sunken"
                    />
                  )}
                  <a href={`/api/registrations/${r.id}/ics`} className={buttonClass("ghost", "sm", "h-10 text-[13.5px]")}>
                    <CalendarPlus className="size-3.5" aria-hidden /> Add to calendar
                  </a>
                  {r.cert_id && (
                    <Link href={`/certificates/${r.cert_id}`} className={buttonClass("ghost", "sm", "h-10 text-[13.5px]")}>
                      <Award className="size-3.5" aria-hidden /> Certificate
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saved.length > 0 && (
        <section aria-labelledby="saved-heading" className="space-y-4">
          <h2 id="saved-heading" className="flex items-center gap-2 text-[22px] font-semibold">
            <Star className="size-5 fill-[#FFD166] text-[#FFD166]" aria-hidden /> Interested
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {saved.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/events/${e.slug}#register`}
                  className="group flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-3 pr-4 transition-shadow duration-fast hover:shadow-raised"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                    <EventArt accent={accentFor({ id: e.event_id, category: e.category })} seed={e.event_id} scrim={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15.5px] font-semibold text-ink">{e.title}</p>
                    <p className="truncate text-[13.5px] text-ink-muted">
                      {fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })}, {fmtTime(new Date(e.starts_at))}, {e.venue}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[13.5px] font-semibold ${e.full ? "text-danger" : "text-ink"}`}>{e.full ? "Full" : "Register"}</span>
                  <ChevronRight className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="space-y-5">
          <h2 id="past-heading" className="text-[22px] font-semibold">
            Where you&apos;ve been
          </h2>
          <ul className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            {past.map((r) => (
              <li key={r.id} className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <EventArt accent={accentFor({ id: r.event_id, category: r.category })} seed={r.event_id} scrim={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/events/${r.slug}`} className="block truncate text-[15px] font-semibold hover:underline hover:underline-offset-4">
                    {r.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[14px] text-ink-muted">
                    {fmtDate(new Date(r.starts_at), { day: "numeric", month: "short", year: "numeric" })} · {r.venue}
                  </p>
                </div>
                {r.cert_id ? (
                  <LinkButton href={`/certificates/${r.cert_id}`} variant="secondary" size="sm" className="shrink-0">
                    <Award className="size-3.5" aria-hidden /> Certificate
                  </LinkButton>
                ) : (
                  <Chip className="shrink-0 whitespace-nowrap">{r.status === "waitlisted" ? "Didn't get a seat" : r.checked_in_at ? "Checked in" : "Missed"}</Chip>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
