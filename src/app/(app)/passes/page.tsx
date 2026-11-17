import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Award, CalendarPlus, CheckCircle2, Clock, Hourglass, MapPin, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { all } from "@/lib/db";
import { passQrPayload } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { accentFor } from "@/lib/data/events";
import { EventArt } from "@/components/ui/EventArt";
import { PageHero } from "@/components/brand/PageHero";
import { SavePassButton } from "@/components/passes/SavePassButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton, buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My passes" };
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
      qr.set(r.id, await QRCode.toString(passQrPayload(r.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111110", light: "#ffffff" } }));
    }
  }

  return (
    <div className="space-y-14 pb-8">
      <PageHero
        eyebrow="My passes"
        title={
          <>
            Your <em>tickets.</em>
          </>
        }
        sub="Show the QR at the gate. Saved images work offline too."
        actions={
          upcoming.length > 0 ? (
            <span className="rounded-full bg-surface px-3.5 py-1.5 text-[13px] text-ink-muted shadow-card">
              <span className="font-mono tabular-nums text-ink">{upcoming.length}</span> upcoming
            </span>
          ) : undefined
        }
      />

      {upcoming.length === 0 ? (
        <EmptyState icon={Ticket} title="No upcoming passes" action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {upcoming.map((r) => (
            <PassCard key={r.id} r={r} qrSvg={qr.get(r.id) ?? null} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="space-y-5">
          <h2 id="past-heading" className="text-display-md font-semibold">
            Past events
          </h2>
          <ul className="card divide-y divide-line">
            {past.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <Link href={`/events/${r.slug}`} className="block truncate text-[15px] font-medium hover:underline hover:decoration-line-strong hover:underline-offset-4">
                    {r.title}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">
                    <span className="font-mono">{fmtDate(new Date(r.starts_at), { day: "numeric", month: "short", year: "numeric" })}</span> · {r.venue}
                  </p>
                </div>
                {r.cert_id ? (
                  <LinkButton href={`/certificates/${r.cert_id}`} variant="secondary" size="sm" className="shrink-0">
                    <Award className="size-3.5" aria-hidden /> Certificate
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

function PassCard({ r, qrSvg }: { r: PassRow; qrSvg: string | null }) {
  const starts = new Date(r.starts_at);
  const ends = new Date(r.ends_at);
  const live = Date.parse(r.starts_at) <= Date.now();
  const cancelled = r.event_status === "cancelled";

  return (
    <article aria-label={`Pass for ${r.title}`} className="card flex flex-col overflow-hidden sm:flex-row">
      {/* Stub: poster strip with date */}
      <div className="relative isolate flex shrink-0 flex-row items-end justify-between gap-3 p-5 text-white sm:w-[176px] sm:flex-col sm:items-start">
        <EventArt accent={accentFor({ id: r.event_id, category: r.category })} />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/80">{fmtDate(starts, { weekday: "short" })}</p>
          <p className="text-[44px] font-semibold leading-none tracking-[-0.05em] tabular-nums">{fmtDate(starts, { day: "numeric" })}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/80">{fmtDate(starts, { month: "short", year: "numeric" })}</p>
        </div>
        <div className="relative">
          {cancelled ? (
            <Chip tone="danger">Event cancelled</Chip>
          ) : r.status === "waitlisted" ? (
            <Chip tone="warn">Waitlist{r.waitlist_position ? ` · #${r.waitlist_position}` : ""}</Chip>
          ) : live ? (
            <Chip tone="white" pulse>
              Happening now
            </Chip>
          ) : (
            <Chip tone="white">Confirmed</Chip>
          )}
        </div>
      </div>

      {/* Perforation (vertical on wide, horizontal on phones) */}
      <div aria-hidden className="relative hidden w-0 border-l border-dashed border-line-strong sm:block" />

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h2 className="truncate text-h3 font-semibold">{r.title}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-2">
            <Clock className="size-3.5 text-ink-subtle" aria-hidden /> {fmtRange(starts, ends)} <span className="text-ink-subtle">IST</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-2">
            <MapPin className="size-3.5 text-ink-subtle" aria-hidden /> {r.venue}
          </p>
        </div>

        <div className="flex gap-4">
          {r.status === "registered" && qrSvg ? (
            <div className="w-[116px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line [&>svg]:size-full" role="img" aria-label={`QR code for pass ${r.pass_code}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
          ) : (
            <div className="grid w-[116px] shrink-0 place-items-center rounded-xl border border-dashed border-line-strong bg-sunken/50 p-3 text-center text-[11.5px] text-ink-muted">
              <Hourglass className="mb-1 size-4" aria-hidden />
              {cancelled ? "No entry" : "QR appears when you get a seat"}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5 text-[13px]">
            {r.status === "registered" && (
              <>
                <p className="eyebrow">Pass</p>
                <p className="font-mono text-[15px] font-medium tracking-[0.12em]">{r.pass_code}</p>
              </>
            )}
            {r.checked_in_at && (
              <p className="flex items-center gap-1.5 font-medium text-live">
                <CheckCircle2 className="size-4" aria-hidden /> Checked in at {fmtTime(new Date(r.checked_in_at))}
              </p>
            )}
            {r.cert_id && (
              <Link href={`/certificates/${r.cert_id}`} className="link inline-flex items-center gap-1">
                <Award className="size-3.5" aria-hidden /> Your certificate
              </Link>
            )}
            {r.status === "registered" && r.price_paise > 0 && (
              <p className={r.payment_status === "paid" ? "font-medium text-live" : "font-medium text-warn"}>
                {r.payment_status === "paid" ? "Paid" : r.upi_utr ? "Payment being checked" : `Unpaid · ${formatINR(r.price_paise)}${r.organizer_upi_id ? "" : " at the desk"}`}
              </p>
            )}
            {r.status === "waitlisted" &&
              (r.hold_expires_at ? (
                <p className="rounded-lg bg-warn-soft px-2.5 py-2 font-medium text-warn">
                  A seat is held for you until {fmtTime(new Date(r.hold_expires_at))}.{" "}
                  <Link href={`/events/${r.slug}`} className="underline underline-offset-2">
                    Confirm it
                  </Link>
                </p>
              ) : (
                <p className="text-ink-muted">If someone cancels, you&apos;ll get a seat to confirm.</p>
              ))}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
          {r.status === "registered" && qrSvg && (
            <SavePassButton
              title={r.title}
              dateLabel={fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}
              timeLabel={fmtRange(starts, ends)}
              venue={r.venue}
              passCode={r.pass_code}
              qrSvg={qrSvg}
              className="h-8 px-3 text-[13px]"
            />
          )}
          <a href={`/api/registrations/${r.id}/ics`} className={buttonClass("ghost", "sm")}>
            <CalendarPlus className="size-3.5" aria-hidden /> Add to calendar
          </a>
          <Link href={`/events/${r.slug}`} className={buttonClass("ghost", "sm", "ml-auto")}>
            View event
          </Link>
        </div>
      </div>
    </article>
  );
}
