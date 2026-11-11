import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getViewer } from "@/lib/rbac";
import { all } from "@/lib/db";
import { passQrPayload } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { Ticket } from "@/components/ui/Ticket";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/brand/PageHero";
import { SavePassButton } from "@/components/passes/SavePassButton";
import { TOKENS } from "@/styles/tokens";

export const metadata: Metadata = { title: "My passes" };
export const dynamic = "force-dynamic";

interface PassRow {
  id: string;
  status: "registered" | "waitlisted";
  pass_code: string;
  pass_token: string;
  payment_status: "paid" | "unpaid";
  upi_utr: string | null;
  cert_id: string | null;
  organizer_upi_id: string | null;
  hold_expires_at: string | null;
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
}

export default async function PassesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/passes");

  const rows = await all<PassRow>(
    `SELECT r.id, r.status, r.pass_code, r.pass_token, r.payment_status, r.upi_utr, r.hold_expires_at, r.created_at, e.organizer_upi_id,
            e.id AS event_id, e.slug, e.title, e.category, COALESCE(e.venue, 'Venue TBA') AS venue, e.starts_at, e.ends_at, e.price_paise, e.status AS event_status,
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

  const now = Date.now();
  const upcoming = rows.filter((r) => Date.parse(r.ends_at) > now);
  const past = rows.filter((r) => Date.parse(r.ends_at) <= now).reverse();

  const qr = new Map<string, string>();
  for (const r of upcoming) {
    if (r.status === "registered" && r.event_status !== "cancelled") {
      qr.set(r.id, await QRCode.toString(passQrPayload(r.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } }));
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <PageHero eyebrow="My passes" title="Your passes" sub={upcoming.length ? `${upcoming.length} upcoming` : undefined} />

      {upcoming.length === 0 ? (
        <EmptyState title="No upcoming passes." body="Register for an event and its pass appears here." action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <div className="grid gap-12 2xl:grid-cols-2">
          {upcoming.map((r) => (
            <PassCard key={r.id} r={r} qrSvg={qr.get(r.id) ?? null} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-h">
          <h2 id="past-h" className="border-b border-line pb-3 text-heading">
            Past events
          </h2>
          <ul>
            {past.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
                <div className="min-w-0">
                  <Link href={`/events/${r.slug}`} className="block truncate text-body font-semibold hover:underline">
                    {r.title}
                  </Link>
                  <p className="font-mono text-label text-ink-muted">
                    {fmtDate(new Date(r.starts_at), { day: "numeric", month: "short", year: "numeric" })} · {r.venue}
                  </p>
                </div>
                {r.cert_id ? (
                  <LinkButton href={`/certificates/${r.cert_id}`} size="sm" variant="secondary">
                    Certificate
                  </LinkButton>
                ) : (
                  <Chip>{r.status === "waitlisted" ? "Didn't get a seat" : r.checked_in_at ? "Checked in" : "Not checked in"}</Chip>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** One pass: the ticket itself, then what's true about it and what you can do. */
function PassCard({ r, qrSvg }: { r: PassRow; qrSvg: string | null }) {
  const starts = new Date(r.starts_at);
  const ends = new Date(r.ends_at);
  const live = Date.parse(r.starts_at) <= Date.now();
  const cancelled = r.event_status === "cancelled";
  const seat = r.status === "registered" && !cancelled;

  return (
    <article className="flex min-w-0 flex-col gap-4">
      <Ticket
        label={`Pass for ${r.title}`}
        category={cap(r.category)}
        title={r.title}
        dateLabel={fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}
        time={fmtTime(starts)}
        venue={r.venue}
        tagline={seat ? null : cancelled ? "Event cancelled — no entry" : "Your QR appears when you get a seat"}
        qrValue={null}
        qrSvg={seat ? qrSvg : null}
        passCode={seat ? r.pass_code : null}
        priceLabel={r.price_paise > 0 ? formatINR(r.price_paise) : "Free"}
        seatsLabel={fmtRange(starts, ends)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {cancelled ? (
          <Chip tone="danger">Event cancelled</Chip>
        ) : r.status === "waitlisted" ? (
          <Chip tone="warn">Waitlist{r.waitlist_position ? ` · #${r.waitlist_position}` : ""}</Chip>
        ) : live ? (
          <Chip tone="live" pulse>
            Happening now
          </Chip>
        ) : (
          <Chip>Confirmed</Chip>
        )}
        {r.checked_in_at && <Chip tone="live">Checked in {fmtTime(new Date(r.checked_in_at))}</Chip>}
        {r.status === "registered" && r.price_paise > 0 && (
          <Chip tone={r.payment_status === "paid" ? "live" : "warn"}>
            {r.payment_status === "paid" ? "Paid" : r.upi_utr ? "Payment being checked" : `Unpaid · ${formatINR(r.price_paise)}${r.organizer_upi_id ? "" : " at the desk"}`}
          </Chip>
        )}
      </div>
      {r.status === "waitlisted" && r.hold_expires_at && (
        <p className="border-l-2 border-warn pl-3 text-body-sm">
          A seat is held for you until <span className="font-mono">{fmtTime(new Date(r.hold_expires_at))}</span>.{" "}
          <Link href={`/events/${r.slug}`} className="font-semibold underline underline-offset-4">
            Confirm it
          </Link>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <LinkButton href={`/events/${r.slug}`} size="sm" variant="secondary">
          View event
        </LinkButton>
        <a href={`/api/registrations/${r.id}/ics`} className={buttonClass("secondary", "sm")}>
          Add to calendar
        </a>
        {seat && qrSvg && (
          <SavePassButton
            title={r.title}
            dateLabel={fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}
            timeLabel={fmtRange(starts, ends)}
            venue={r.venue}
            passCode={r.pass_code}
            qrSvg={qrSvg}
            className="h-8 rounded-sm px-3 text-label"
          />
        )}
        {r.cert_id && (
          <LinkButton href={`/certificates/${r.cert_id}`} size="sm" variant="ghost">
            Certificate ›
          </LinkButton>
        )}
      </div>
    </article>
  );
}
