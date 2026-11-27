import { kindFor } from "@/lib/categories";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Award, CalendarPlus } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { all } from "@/lib/db";
import { passQrPayload } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { accentFor } from "@/lib/data/events";
import { accentHex, accentInk } from "@/components/ui/EventArt";
import { PageHero } from "@/components/brand/PageHero";
import { SavePassButton } from "@/components/passes/SavePassButton";
import { buttonClass } from "@/components/ui/Button";
import { HoloPass } from "@/components/passes/HoloPass";
import { brandQr, qrArtSvg } from "@/lib/qr-art";
import { directionsUrl } from "@/lib/organizer/shared";

export const metadata: Metadata = { title: "My passes" };
export const dynamic = "force-dynamic";

function serialFor(code: string, eventId: string) {
  let h = 0x811c9dc5;
  for (const ch of `${code}|${eventId}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const hex = h.toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

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
  team_name: string | null;
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
            e.id AS event_id, e.slug, e.title, e.category, COALESCE(e.venue, 'Venue TBA') AS venue, e.starts_at, e.ends_at, COALESCE(r.amount_paise, e.price_paise) AS price_paise, e.status AS event_status,
            e.event_type, e.venue_place_id, e.venue_lat, e.venue_lng, e.requires_approval,
            (SELECT t.name FROM teams t WHERE t.id = r.team_id) AS team_name,
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

  const answerRows = await all<{ registration_id: string; label: string; value: string }>(
    `SELECT a.registration_id, q.label, a.value FROM registration_answers a
       JOIN event_questions q ON q.id = a.question_id
       JOIN registrations r ON r.id = a.registration_id
      WHERE r.user_id = ? AND r.status IN ('registered','waitlisted') AND (q.kind = 'choice' OR q.label LIKE '%team%' OR q.label LIKE '%jersey%')
      ORDER BY q.created_at`,
    viewer.id,
  );
  const catOf = new Map(rows.map((r) => [r.id, r.category]));
  const byReg = new Map<string, { label: string; value: string }[]>();
  for (const r of rows) if (r.team_name) byReg.set(r.id, [{ label: "Team", value: r.team_name }]);
  for (const a of answerRows) {
    if (/team/i.test(a.label) && rows.find((r) => r.id === a.registration_id)?.team_name) continue;
    byReg.set(a.registration_id, [...(byReg.get(a.registration_id) ?? []), { label: a.label, value: a.value }]);
  }
  const logistics = new Map<string, { label: string; value: string }[]>();
  for (const [reg, items] of byReg) {
    const order = kindFor(catOf.get(reg))?.passBadges ?? [];
    const rank = (l: string) => {
      const i = order.findIndex((o) => l.toLowerCase().includes(o));
      return i === -1 ? order.length : i;
    };
    logistics.set(reg, [...items].sort((x, y) => rank(x.label) - rank(y.label)).slice(0, 4));
  }

  const saved = await all<{
    slug: string;
    title: string;
    event_id: string;
    category: string;
    starts_at: string;
    venue: string;
    price_paise: number;
    full: number;
  }>(
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
      qr.set(
        r.id,
        brandQr(passQrPayload(r.pass_token), {
          kind: "pass",
          accent: accentHex(accentFor({ id: r.event_id, category: r.category })),
        }),
      );
    }
  }

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        title={
          <>
            Pass <span className="text-[#D4B87A]">Wallet.</span>
          </>
        }
        actions={
          <dl className="flex items-baseline gap-8">
            <div>
              <dt className="tr-meta text-ink-muted">Active</dt>
              <dd className="font-display text-[32px] font-semibold italic leading-none tabular-nums text-ink">{upcoming.length}</dd>
            </div>
            <div>
              <dt className="tr-meta text-ink-muted">Saved</dt>
              <dd className="font-display text-[32px] font-semibold italic leading-none tabular-nums text-ink">{saved.length}</dd>
            </div>
            <div>
              <dt className="tr-meta text-ink-muted">Past</dt>
              <dd className="font-display text-[32px] font-semibold italic leading-none tabular-nums text-ink">{past.length}</dd>
            </div>
          </dl>
        }
      />

      {upcoming.length === 0 ? (
        <section className="relative overflow-hidden rounded-[6px] border border-line bg-surface p-8 md:p-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gate-desk.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(22,24,32,0.96) 0%, rgba(22,24,32,0.78) 65%, rgba(22,24,32,0.6) 100%)",
            }}
          />
          <div className="relative z-10 max-w-[520px]">
            <h2 className="font-display text-[clamp(34px,4.2vw,54px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
              No active passes yet.
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/events"
                className="group inline-flex h-12 items-center gap-2 rounded-[4px] bg-[#D4B87A] px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:bg-[#E0C78E]"
              >
                <span>Explore events</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/calendar"
                className="inline-flex h-12 items-center rounded-[4px] border border-[#EFEAE0]/25 px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-[#EFEAE0] transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
              >
                Calendar
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid justify-items-center gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((r) => {
            const starts = new Date(r.starts_at);
            const ends = new Date(r.ends_at);
            const cancelled = r.event_status === "cancelled";
            const qrSvg = qr.get(r.id) ?? null;
            const accent = accentFor({ id: r.event_id, category: r.category });
            const qrArt = qrSvg
              ? qrArtSvg(passQrPayload(r.pass_token), { ink: accentInk(accent), accent: accentHex(accent) })
              : null;
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
                        ? "Awaiting host approval."
                        : r.hold_expires_at
                          ? `Seat held until ${fmtTime(new Date(r.hold_expires_at))}.`
                          : `Waitlist${r.waitlist_position ? ` #${r.waitlist_position}` : ""}.`
                      : null
                  }
                  pay={
                    r.status === "registered" && r.price_paise > 0
                      ? r.payment_status === "paid"
                        ? { text: "Paid", tone: "ok" }
                        : r.upi_utr
                          ? { text: "Checking UTR", tone: "warn" }
                          : r.organizer_upi_id
                            ? { text: `Pay ${formatINR(r.price_paise)}`, tone: "warn", href: `/events/${r.slug}#register` }
                            : { text: `${formatINR(r.price_paise)} at gate`, tone: "warn" }
                      : null
                  }
                  admittedAt={r.checked_in_at ? fmtTime(new Date(r.checked_in_at)) : null}
                  startsAt={r.starts_at}
                  endsAt={r.ends_at}
                  directions={
                    r.event_type !== "virtual" && r.venue !== "Venue TBA"
                      ? directionsUrl({ venue: r.venue, venue_place_id: r.venue_place_id, venue_lat: r.venue_lat, venue_lng: r.venue_lng })
                      : null
                  }
                  logistics={logistics.get(r.id) ?? []}
                />
                <div className="mt-3 flex w-full max-w-[360px] flex-wrap items-center justify-center gap-1">
                  {r.status === "registered" && qrSvg && (
                    <SavePassButton
                      title={r.title}
                      dateLabel={fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}
                      timeLabel={fmtRange(starts, ends)}
                      venue={r.venue}
                      passCode={r.pass_code}
                      qrSvg={qrSvg}
                      className="h-10 border-0 bg-transparent px-3 text-[13px] hover:bg-surface"
                    />
                  )}
                  <a href={`/api/registrations/${r.id}/ics`} className={buttonClass("ghost", "sm", "h-10")}>
                    <CalendarPlus className="size-3.5" aria-hidden /> Calendar
                  </a>
                  {r.cert_id && (
                    <Link href={`/certificates/${r.cert_id}`} className={buttonClass("ghost", "sm", "h-10")}>
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
          <h2 id="saved-heading" className="border-b border-line pb-3 font-display text-[32px] font-bold italic text-ink">
            Saved
          </h2>
          <ul className="divide-y divide-line border-b border-line">
            {saved.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/events/${e.slug}#register`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface sm:px-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-[24px] font-semibold italic text-ink group-hover:text-[#D4B87A]">
                      {e.title}
                    </p>
                    <p className="tr-meta mt-1 text-ink-muted">
                      {fmtDate(new Date(e.starts_at), { day: "numeric", month: "short" })} · {fmtTime(new Date(e.starts_at))} · {e.venue}
                    </p>
                  </div>
                  <span className="tr-meta shrink-0 text-[#D4B87A]">
                    {e.full ? "Full" : "Register"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="space-y-4">
          <h2 id="past-heading" className="border-b border-line pb-3 font-display text-[32px] font-bold italic text-ink">
            Past Events
          </h2>
          <ul className="divide-y divide-line border-b border-line">
            {past.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <Link href={`/events/${r.slug}`} className="block truncate font-display text-[22px] font-semibold italic text-ink hover:text-[#D4B87A]">
                    {r.title}
                  </Link>
                  <p className="tr-meta mt-1 text-ink-muted">
                    {fmtDate(new Date(r.starts_at), { day: "numeric", month: "short", year: "numeric" })} · {r.venue}
                  </p>
                </div>
                {r.cert_id ? (
                  <Link href={`/certificates/${r.cert_id}`} className="tr-meta tr-link shrink-0 text-[#D4B87A]">
                    Certificate
                  </Link>
                ) : (
                  <span className="tr-meta shrink-0 text-ink-muted">
                    {r.checked_in_at ? "Attended" : r.status === "waitlisted" ? "Waitlisted" : "Ended"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
