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

export const metadata: Metadata = { title: "My passes" };
export const dynamic = "force-dynamic";

interface PassRow {
  id: string;
  status: "registered" | "waitlisted";
  pass_code: string;
  pass_token: string;
  payment_status: "paid" | "unpaid";
  upi_utr: string | null;
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
      qr.set(r.id, await QRCode.toString(passQrPayload(r.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b0b0f", light: "#ffffff" } }));
    }
  }

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <PageHero eyebrow="My passes" title={<>Your <em>tickets</em></>} sub="Show the QR code at the gate. Screenshots work too." marquee={["Your pass", "Walk in", "Scan at the gate"]} />

      {upcoming.length === 0 ? (
        <section className="card flex flex-col items-start gap-3 p-8">
          <Ticket className="size-8 text-ink-subtle" />
          <h2 className="title-xl text-[32px]">No upcoming passes</h2>
          <p className="text-[14.5px] text-ink-muted">When you register for an event, your pass shows up here.</p>
          <Link href="/events" className="mt-1 rounded-full bg-volt px-5 py-2.5 text-[14px] font-semibold text-ink-inverse">Find an event</Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {upcoming.map((r) => (
            <PassCard key={r.id} r={r} qrSvg={qr.get(r.id) ?? null} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="title-xl text-[32px]">Past events</h2>
          <ul className="card divide-y divide-line">
            {past.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <Link href={`/events/${r.slug}`} className="block truncate text-[14.5px] font-semibold hover:underline">{r.title}</Link>
                  <p className="text-[12.5px] text-ink-muted">{fmtDate(new Date(r.starts_at), { day: "numeric", month: "short", year: "numeric" })} · {r.venue}</p>
                </div>
                {r.checked_in_at ? (
                  <Link href={`/certificates/${r.id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-volt/40 bg-volt/10 px-3 py-1.5 text-[12.5px] font-bold text-volt hover:bg-volt hover:text-ink-inverse">
                    <Award className="size-3.5" aria-hidden /> Certificate
                  </Link>
                ) : <Chip>{r.status === "waitlisted" ? "Didn't get a seat" : "Not checked in"}</Chip>}
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
    <article className="card overflow-hidden animate-fade-up">
      <div className="relative isolate flex items-end justify-between gap-3 p-5 text-white">
        <EventArt accent={accentFor({ id: r.event_id, category: r.category })} />
        <div className="relative min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/80">{fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}</p>
          <h2 className="truncate text-[22px] font-extrabold leading-tight">{r.title}</h2>
        </div>
        <div className="relative shrink-0">
          {cancelled ? (
            <Chip tone="danger">Event cancelled</Chip>
          ) : r.status === "waitlisted" ? (
            <Chip tone="warn">Waitlist{r.waitlist_position ? ` · #${r.waitlist_position}` : ""}</Chip>
          ) : live ? (
            <Chip tone="volt" pulse>Happening now</Chip>
          ) : (
            <Chip tone="white">Confirmed</Chip>
          )}
        </div>
      </div>

      <div className="flex gap-5 p-5">
        {r.status === "registered" && qrSvg ? (
          <div className="w-[132px] shrink-0 rounded-xl border border-line bg-white p-2 [&>svg]:size-full" role="img" aria-label={`QR code for pass ${r.pass_code}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
        ) : (
          <div className="grid w-[132px] shrink-0 place-items-center rounded-xl border border-dashed border-line bg-canvas p-3 text-center text-[12px] font-semibold text-ink-muted">
            <Hourglass className="mb-1 size-5" />
            {cancelled ? "No entry" : "QR appears when you get a seat"}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2 text-[13.5px]">
          {r.status === "registered" && <p className="font-mono text-[15px] font-bold tracking-[0.1em]">{r.pass_code}</p>}
          <p className="flex items-center gap-1.5 text-ink-2"><Clock className="size-4 text-ink-subtle" /> {fmtRange(starts, ends)} <span className="text-[11.5px] text-ink-subtle">IST</span></p>
          <p className="flex items-center gap-1.5 text-ink-2"><MapPin className="size-4 text-ink-subtle" /> {r.venue}</p>

          {r.checked_in_at && (
            <p className="flex items-center gap-1.5 font-semibold text-live"><CheckCircle2 className="size-4" /> Checked in at {fmtTime(new Date(r.checked_in_at))}</p>
          )}
          {r.status === "registered" && r.price_paise > 0 && (
            <p className={r.payment_status === "paid" ? "font-semibold text-live" : "font-semibold text-warn"}>
              {r.payment_status === "paid" ? "Paid" : r.upi_utr ? "Payment being checked" : `Unpaid · ${formatINR(r.price_paise)}${r.organizer_upi_id ? "" : " at the desk"}`}
            </p>
          )}
          {r.status === "waitlisted" &&
            (r.hold_expires_at ? (
              <p className="rounded-xl bg-warn-soft px-3 py-2 font-semibold text-warn">
                A seat is held for you until {fmtTime(new Date(r.hold_expires_at))}.{" "}
                <Link href={`/events/${r.slug}`} className="underline">Confirm it</Link>
              </p>
            ) : (
              <p className="text-ink-muted">If someone cancels, you&apos;ll get a seat to confirm.</p>
            ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <a href={`/api/registrations/${r.id}/ics`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold hover:border-volt/60">
              <CalendarPlus className="size-4" /> Add to calendar
            </a>
            {r.status === "registered" && qrSvg && (
              <SavePassButton
                title={r.title}
                dateLabel={fmtDate(starts, { weekday: "short", day: "numeric", month: "short" })}
                timeLabel={fmtRange(starts, ends)}
                venue={r.venue}
                passCode={r.pass_code}
                qrSvg={qrSvg}
              />
            )}
            <Link href={`/events/${r.slug}`} className="inline-flex items-center rounded-full px-3 py-2 text-[13px] font-semibold text-ink-muted hover:text-ink">View event</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
