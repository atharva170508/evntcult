import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, ArrowUpRight, Camera, CalendarDays, ChevronRight, Link as LinkIcon, MapPin, Navigation, Pencil, ScanLine, Ticket, Users, Video } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { getViewer } from "@/lib/rbac";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { passQrPayload } from "@/lib/tokens";
import { formatINR, upiUri } from "@/lib/money";
import { directionsUrl, linkLabel } from "@/lib/organizer/shared";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { Entrance } from "@/components/motion/MaskedLines";
import { EventArt } from "@/components/ui/EventArt";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { RegisterPanel } from "@/components/events/RegisterPanel";
import { photoAccess } from "@/lib/data/photos";
import { getDB } from "@/lib/db";
import { siteHost } from "@/lib/organizer/page-data";
import { listQuestions } from "@/lib/data/questions";
import { ShareEvent } from "@/components/events/ShareEvent";
import { WhatsAppPrompt } from "@/components/events/WhatsAppPrompt";

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
      ? await QRCode.toString(passQrPayload(reg.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#222222", light: "#ffffff" } })
      : null;

  const upiUrl =
    reg?.status === "registered" && e.price_paise > 0 && reg.payment_status !== "paid" && e.organizer_upi_id
      ? upiUri({ vpa: e.organizer_upi_id, payeeName: e.title, amountPaise: e.price_paise, note: reg.pass_code })
      : null;
  const upiQr = upiUrl ? await QRCode.toString(upiUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#222222", light: "#ffffff" } }) : null;

  const waitlistPosition = reg?.status === "waitlisted" ? await waitlistPos(e.id, reg.id) : null;
  const db = await getDB();
  const photos = await photoAccess(db, viewer, e.id);
  const [questions, host] = await Promise.all([listQuestions(db, e.id), siteHost()]);
  const shareUrl = `${host.startsWith("localhost") ? "http" : "https"}://${host}/e/${e.slug}`;
  const photoCount = photos.view
    ? ((await db.prepare("SELECT COUNT(*) AS n FROM photos WHERE event_id = ?").bind(e.id).first<{ n: number }>())?.n ?? 0)
    : 0;

  const where =
    e.event_type === "virtual" ? (
      <>
        Online
        {e.meeting_url && (d.isOwner || reg?.status === "registered") ? (
          <>
            {" · "}
            <a href={e.meeting_url} target="_blank" rel="noreferrer" className="link">
              Join link
            </a>
          </>
        ) : (
          <span className="font-normal text-ink-muted"> · link shown on your pass</span>
        )}
      </>
    ) : (
      <>
        {e.venue ?? "Venue TBA"}
        {e.venue && e.venue_status === "confirmed" && (
          <a
            href={directionsUrl({ venue: e.venue, venue_place_id: e.venue_place_id, venue_lat: e.venue_lat, venue_lng: e.venue_lng })}
            target="_blank"
            rel="noopener"
            className="ml-2 inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <Navigation className="size-3.5" aria-hidden /> Directions
          </a>
        )}
      </>
    );

  const facts = [
    { icon: CalendarDays, label: fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long" }), value: <>{fmtRange(s.startsAt, s.endsAt)} IST</> },
    { icon: e.event_type === "virtual" ? Video : MapPin, label: e.event_type === "virtual" ? "Where" : "Venue", value: where },
    {
      icon: Ticket,
      label: "Entry",
      value: e.price_paise ? (
        <>
          {formatINR(e.price_paise)}
          <span className="font-normal text-ink-muted">{e.organizer_upi_id ? " · pay by UPI" : " · pay at the desk"}</span>
        </>
      ) : (
        "Free"
      ),
    },
  ];

  const kind = e.category ? (LABEL[e.category] ?? e.category) : "Event";
  const priceLabel = e.price_paise ? formatINR(e.price_paise) : "Free";
  const canRegister = !!viewer && !d.isOwner && !reg && e.status === "published" && !ended;

  return (
    <div className="pb-28 pt-6 md:pb-10 md:pt-8">
      <Link href="/events" className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink md:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Events
      </Link>

      {/* Title row */}
      <Entrance delay={0.02} className="mt-4 md:mt-0">
        <div className="flex flex-wrap gap-1.5">
          {e.access === "code" && <Chip tone="dark">Private · code only</Chip>}
          {e.status === "draft" && <Chip tone="warn">Draft · only you can see this</Chip>}
          {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
          {ended && e.status !== "cancelled" && <Chip>Ended</Chip>}
        </div>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[32px]">{e.title}</h1>
        <p className="mt-1.5 text-[15px] text-ink-2">
          <span className="font-semibold">{kind}</span>
          <span className="text-ink-subtle"> · </span>
          {fmtDate(s.startsAt, { weekday: "short", day: "numeric", month: "short" })}, {fmtTime(s.startsAt)}
          <span className="text-ink-subtle"> · </span>
          <span className="underline decoration-line-strong underline-offset-2">{e.event_type === "virtual" ? "Online" : (e.venue ?? "Venue TBA")}</span>
        </p>
      </Entrance>

      {/* Cover */}
      <Entrance delay={0.12} className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[20px] bg-sunken shadow-[0_24px_48px_-28px_rgba(60,40,10,0.45)] sm:aspect-[2.4/1]">
        <EventArt accent={s.accent} seed={s.id} scrim={false} />
        {e.banner_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.banner_url} alt="" className="absolute inset-0 size-full object-cover" />
          </>
        )}
      </Entrance>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
        {/* Details */}
        <div className="min-w-0">
          {s.tagline && <p className="border-b border-line pb-8 font-display text-[28px] leading-snug text-ink">{s.tagline}</p>}

          <dl className="divide-y divide-line border-b border-line">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-5 py-5">
                <f.icon className="mt-0.5 size-6 shrink-0 text-ink" strokeWidth={1.6} aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[16px] font-semibold text-ink">{f.label}</dt>
                  <dd className="mt-0.5 text-[15px] text-ink-muted">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {e.description && (
            <section aria-labelledby="about-h" className="border-b border-line py-8">
              <h2 id="about-h" className="text-[22px] font-semibold text-ink">
                About this event
              </h2>
              <div className="mt-4 max-w-prose whitespace-pre-line text-[16px] leading-[1.7] text-ink-2">{e.description}</div>
            </section>
          )}

          {(e.link_url || (photos.view && (photoCount > 0 || photos.manage))) && (
            <div className="grid gap-3 border-b border-line py-8 sm:grid-cols-2">
              {photos.view && (photoCount > 0 || photos.manage) && (
                <Link href={`/events/${e.slug}/photos`} className="group flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-4 transition-shadow hover:shadow-raised">
                  <Camera className="size-6 shrink-0 text-ink" strokeWidth={1.6} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">Photos</span>
                    <span className="block text-[13.5px] text-ink-muted">{photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : photos.manage ? "Add photos" : "None yet"}</span>
                  </span>
                  <ChevronRight className="size-5 text-ink-subtle" aria-hidden />
                </Link>
              )}
              {e.link_url && (
                <a href={e.link_url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-4 transition-shadow hover:shadow-raised">
                  <LinkIcon className="size-6 shrink-0 text-ink" strokeWidth={1.6} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">More info</span>
                    <span className="block truncate text-[13.5px] text-ink-muted">{linkLabel(e.link_url)}</span>
                  </span>
                  <ArrowUpRight className="size-5 text-ink-subtle" aria-hidden />
                </a>
              )}
            </div>
          )}

          {e.status === "published" && e.access === "public" && (
            <section aria-label="Share" className="py-8">
              <ShareEvent url={shareUrl} title={e.title} />
            </section>
          )}
        </div>

        {/* Booking card */}
        <aside id="register" aria-label="Registration" className="scroll-mt-28 lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
          <div className="rounded-2xl border border-line-strong bg-white p-6 shadow-raised">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[22px] font-semibold text-ink">{priceLabel}</p>
              <p className="text-[14px] text-ink-muted">
                {e.capacity === null ? (
                  `${e.taken} going`
                ) : d.seatsLeft === 0 ? (
                  <span className="font-semibold text-danger">Full</span>
                ) : (
                  <>
                    <span className="font-semibold text-ink">{d.seatsLeft}</span> of {e.capacity} left
                  </>
                )}
              </p>
            </div>
            {e.capacity !== null && <Meter value={e.taken} max={e.capacity} className="mt-3" />}
            <div className="mt-5">
              {!viewer ? (
                <div className="space-y-3">
                  <LinkButton href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} variant="accent" size="lg" className="w-full">
                    Log in to register
                  </LinkButton>
                  <p className="text-center text-[14px] text-ink-muted">
                    New here?{" "}
                    <Link href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`} className="link">
                      Create an account
                    </Link>
                  </p>
                </div>
              ) : d.isOwner ? (
                <div className="space-y-3">
                  <p className="text-[14px] text-ink-muted">
                    You&apos;re hosting this
                    {e.access === "code" && e.access_code ? (
                      <>
                        {" "}
                        · code <span className="font-mono font-medium tracking-[0.12em] text-ink">{e.access_code}</span>
                      </>
                    ) : null}
                  </p>
                  <div className="grid gap-2">
                    {e.status === "published" && (
                      <LinkButton href={`/organizer/scan/${e.id}`} size="lg" className="w-full">
                        <ScanLine className="size-4" aria-hidden /> Gate scanner
                      </LinkButton>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <LinkButton href={`/organizer/events/${e.id}/manage`} variant="secondary">
                        Manage
                      </LinkButton>
                      <LinkButton href={`/organizer/events/${e.id}`} variant="secondary">
                        <Pencil className="size-3.5" aria-hidden /> Edit
                      </LinkButton>
                    </div>
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
                  questions={questions}
                  upi={upiUrl && upiQr && reg ? { regId: reg.id, pricePaise: e.price_paise, vpa: e.organizer_upi_id!, uri: upiUrl, qrSvg: upiQr, utr: reg.upi_utr, rejected: !!reg.upi_rejected_at } : null}
                />
              )}
              {viewer && reg && reg.status !== "cancelled" && viewer.phone && !viewer.whatsappOptIn && (
                <div className="mt-4">
                  <WhatsAppPrompt phone={viewer.phone} />
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[13.5px] text-ink-muted">
            <Users className="size-4" aria-hidden /> {e.taken} going
          </p>
        </aside>
      </div>

      {/* Phones: price and the main action stay in reach. */}
      {(canRegister || !viewer) && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-line-strong bg-white px-gutter pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 lg:hidden">
          <div>
            <p className="text-[17px] font-semibold text-ink">{priceLabel}</p>
            <p className="text-[13px] text-ink-muted">
              {fmtDate(s.startsAt, { day: "numeric", month: "short" })} · {e.capacity === null ? `${e.taken} going` : d.seatsLeft === 0 ? "Full" : `${d.seatsLeft} left`}
            </p>
          </div>
          <a
            href={viewer ? "#register" : `/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`}
            className="inline-flex h-12 items-center rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink"
          >
            {viewer ? (d.seatsLeft === 0 ? "Join waitlist" : "Register") : "Log in to register"}
          </a>
        </div>
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
