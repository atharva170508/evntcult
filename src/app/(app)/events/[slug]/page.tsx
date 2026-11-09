import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Camera, CalendarDays, ChevronRight, Clock, MapPin, Pencil, ScanLine, Ticket, Users, Video } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { passQrPayload } from "@/lib/tokens";
import { formatINR, upiUri } from "@/lib/money";
import { directionsUrl, linkLabel } from "@/lib/organizer/shared";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { EventArt } from "@/components/ui/EventArt";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { RegisterPanel } from "@/components/events/RegisterPanel";
import { photoAccess } from "@/lib/data/photos";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event" };

const LABEL: Record<string, string> = { GAMING: "Gaming", SPORTS: "Sports", TECH: "Tech", CULTURAL: "Cultural", WORKSHOP: "Workshop", TALK: "Talk", PARTY: "Party" };

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ code?: string }> }) {
  const [{ slug }, { code }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  const d = await getEventDetail(slug, viewer, code);
  if (!d) notFound();

  const e = d.event;
  const s = toSummary(e);
  const reg = d.myRegistration;
  const ended = new Date(e.ends_at) <= new Date();
  const qrSvg =
    reg?.status === "registered"
      ? await QRCode.toString(passQrPayload(reg.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b0b0f", light: "#ffffff" } })
      : null;

  const upiUrl =
    reg?.status === "registered" && e.price_paise > 0 && reg.payment_status !== "paid" && e.organizer_upi_id
      ? upiUri({ vpa: e.organizer_upi_id, payeeName: e.title, amountPaise: e.price_paise, note: reg.pass_code })
      : null;
  const upiQr = upiUrl ? await QRCode.toString(upiUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b0b0f", light: "#ffffff" } }) : null;

  const waitlistPosition = reg?.status === "waitlisted" ? await waitlistPos(e.id, reg.id) : null;
  const db = await getDB();
  const photos = await photoAccess(db, viewer, e.id);
  const photoCount = photos.view
    ? ((await db.prepare("SELECT COUNT(*) AS n FROM photos WHERE event_id = ?").bind(e.id).first<{ n: number }>())?.n ?? 0)
    : 0;

  return (
    <div className="space-y-5 pt-4 md:pt-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All events
      </Link>

      <section className="card grid overflow-hidden animate-fade-up md:grid-cols-[1.1fr_1fr]">
        <div className="relative isolate flex min-h-[300px] flex-col justify-between p-6 text-white md:min-h-[520px] md:p-9">
          <EventArt accent={s.accent} />
          {e.banner_url && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.banner_url} alt="" className="absolute inset-0 -z-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" aria-hidden />
            </>
          )}
          <div className="relative flex flex-wrap gap-2">
            <Chip tone="white">{e.category ? (LABEL[e.category] ?? e.category) : "Event"}</Chip>
            {e.access === "code" && <Chip tone="dark">Private · code only</Chip>}
            {e.status === "draft" && <Chip tone="warn">Draft · only you can see this</Chip>}
            {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
          </div>
          <div className="relative">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/80">{fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="shout mt-3 text-[clamp(34px,4.6vw,60px)]">{e.title}</h1>
            {s.tagline && <p className="mt-3 max-w-md text-[20px] font-medium leading-snug text-white/90">{s.tagline}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6 md:p-8">
          <ul className="space-y-3 text-[15px]">
            <li className="flex items-center gap-3"><CalendarDays className="size-5 text-ink-subtle" /> {fmtDate(s.startsAt, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</li>
            <li className="flex items-center gap-3"><Clock className="size-5 text-ink-subtle" /> {fmtRange(s.startsAt, s.endsAt)} <span className="text-[12px] text-ink-subtle">IST</span></li>
            {e.event_type === "virtual" ? (
              <li className="flex items-center gap-3">
                <Video className="size-5 text-ink-subtle" /> Online
                {e.meeting_url && (d.isOwner || reg?.status === "registered") ? (
                  <a href={e.meeting_url} target="_blank" rel="noreferrer" className="font-semibold text-volt underline-offset-4 hover:underline">Join link</a>
                ) : (
                  <span className="text-[13px] text-ink-subtle">· link shown on your pass</span>
                )}
              </li>
            ) : (
              <li className="flex items-center gap-3"><MapPin className="size-5 text-ink-subtle" /> {e.venue ?? "Venue TBA"}
                {e.venue && e.venue_status === "confirmed" && (
                  <a href={directionsUrl({ venue: e.venue, venue_place_id: e.venue_place_id, venue_lat: e.venue_lat, venue_lng: e.venue_lng })} target="_blank" rel="noopener" className="text-[11px] text-ink-muted hover:underline">
                    Directions
                  </a>
                )}
              </li>
            )}
            {e.link_url && (
              <li className="pl-8">
                <a href={e.link_url} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-[11px] text-ink-muted hover:underline">
                  {linkLabel(e.link_url)}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <Ticket className="size-5 text-ink-subtle" />
              {e.price_paise ? (
                <span>
                  {formatINR(e.price_paise)}
                  {e.organizer_upi_id ? (
                    <span className="text-ink-muted"> · pay by UPI to <span className="font-mono text-ink">{e.organizer_upi_id}</span></span>
                  ) : (
                    <span className="text-ink-muted"> · pay at the desk</span>
                  )}
                </span>
              ) : (
                "Free entry"
              )}
            </li>
          </ul>

          <div className="rounded-2xl bg-canvas p-4">
            <div className="flex items-center justify-between text-[13px] font-semibold">
              <span className="flex items-center gap-1.5"><Users className="size-4 text-ink-subtle" /> <span className="font-mono tabular-nums">{e.taken}</span> going</span>
              <span className={d.seatsLeft === 0 ? "text-danger" : "text-ink-2"}>
                {e.capacity === null ? (
                  "No limit"
                ) : (
                  <>
                    <span className="font-mono tabular-nums">{d.seatsLeft}</span> of <span className="font-mono tabular-nums">{e.capacity}</span> seats left
                  </>
                )}
              </span>
            </div>
            {e.capacity !== null && <Meter value={e.taken} max={e.capacity} className="mt-2 bg-white" />}
          </div>

          {!viewer ? (
            <div className="space-y-2">
              <Link href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} className="inline-flex w-full items-center justify-center rounded-full bg-volt py-3.5 text-[15px] font-bold text-ink-inverse hover:bg-volt-hover">Log in to register</Link>
              <p className="text-center text-[13px] text-ink-muted">New here? <Link href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`} className="font-semibold text-ink underline">Sign up</Link> with your email.</p>
            </div>
          ) : d.isOwner ? (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-ink-muted">You organize this event{e.access === "code" && e.access_code ? <> · join code <span className="font-mono font-bold text-ink">{e.access_code}</span></> : null}.</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/organizer/events/${e.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-[14px] font-semibold hover:border-volt/60"><Pencil className="size-4" /> Edit</Link>
                {e.status === "published" && (
                  <Link href={`/organizer/scan/${e.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-volt px-4 py-2.5 text-[14px] font-bold text-ink-inverse hover:bg-volt-hover"><ScanLine className="size-4" /> Open gate scanner</Link>
                )}
              </div>
            </div>
          ) : (
            <RegisterPanel
              slug={e.slug}
              code={code ?? null}
              open={e.status === "published" && !ended}
              closedReason={ended ? "This event has ended." : e.status === "cancelled" ? "This event was cancelled." : e.status !== "published" ? "Registration isn't open." : null}
              full={d.seatsLeft === 0}
              pricePaise={e.price_paise}
              registration={
                reg && reg.status !== "cancelled"
                  ? {
                      id: reg.id,
                      status: reg.status,
                      passCode: reg.pass_code,
                      paid: reg.payment_status === "paid",
                      checkedInAt: reg.checked_in_at ? fmtTime(new Date(reg.checked_in_at)) : null,
                      holdExpiresAt: reg.hold_expires_at ? fmtTime(new Date(reg.hold_expires_at)) : null,
                      waitlistPosition,
                    }
                  : null
              }
              qrSvg={qrSvg}
              hasUpi={!!e.organizer_upi_id}
              upi={upiUrl && upiQr && reg ? { regId: reg.id, pricePaise: e.price_paise, vpa: e.organizer_upi_id!, uri: upiUrl, qrSvg: upiQr, utr: reg.upi_utr, rejected: !!reg.upi_rejected_at } : null}
            />
          )}
        </div>
      </section>

      {photos.view && (photoCount > 0 || photos.manage) && (
        <Link href={`/events/${e.slug}/photos`} className="card flex items-center gap-4 p-5 hover:border-volt/60">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Camera className="size-5" /></span>
          <span className="flex-1">
            <span className="block text-[16px] font-bold">Photos</span>
            <span className="block text-[13px] text-ink-muted">
              {photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "No photos yet"}
              {photos.manage ? " · add photos" : " · tag yourself to save them to your Vault"}
            </span>
          </span>
          <ChevronRight className="size-5 text-ink-subtle" />
        </Link>
      )}

      {e.description && (
        <section className="card p-6 md:p-8">
          <h2 className="title-xl text-[32px]">About</h2>
          <div className="mt-3 space-y-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{e.description}</div>
        </section>
      )}
    </div>
  );
}

async function waitlistPos(eventId: string, regId: string) {
  const { count } = await import("@/lib/db");
  return count(
    `SELECT COUNT(*) AS n FROM registrations w, registrations me
      WHERE me.id = ? AND w.event_id = ? AND w.status = 'waitlisted' AND w.created_at <= me.created_at`,
    regId,
    eventId,
  );
}
