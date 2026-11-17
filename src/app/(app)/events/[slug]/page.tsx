import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, ArrowUpRight, Camera, CalendarDays, ChevronRight, Clock, Link as LinkIcon, MapPin, Navigation, Pencil, ScanLine, Ticket, Users, Video } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
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
    { icon: CalendarDays, label: "Date", value: fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { icon: Clock, label: "Time", value: <>{fmtRange(s.startsAt, s.endsAt)} <span className="font-normal text-ink-subtle">IST</span></> },
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

  return (
    <div className="pb-8 pt-6 md:pt-8">
      <Link href="/events" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-4 transition-transform duration-base ease-out group-hover:-translate-x-0.5" aria-hidden /> All events
      </Link>

      {/* Poster */}
      <section className="relative isolate mt-5 flex min-h-[320px] animate-fade-up flex-col justify-between overflow-hidden rounded-panel p-6 text-white md:min-h-[480px] md:p-10">
        <EventArt accent={s.accent} seed={s.id} />
        {e.banner_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.banner_url} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" aria-hidden />
          </>
        )}
        <div className="relative flex flex-wrap gap-1.5">
          <Chip tone="white">{e.category ? (LABEL[e.category] ?? e.category) : "Event"}</Chip>
          {e.access === "code" && <Chip tone="dark">Private · code only</Chip>}
          {e.status === "draft" && <Chip tone="warn">Draft · only you can see this</Chip>}
          {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
          {ended && e.status !== "cancelled" && <Chip tone="white">Ended</Chip>}
        </div>
        <div className="relative max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/80">
            {fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(s.startsAt)}
          </p>
          <h1 className="mt-3 text-display-xl font-semibold">{e.title}</h1>
          {s.tagline && <p className="mt-4 max-w-xl text-[19px] leading-snug text-white/90">{s.tagline}</p>}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
        {/* Details */}
        <div className="min-w-0 space-y-10">
          <dl className="grid gap-px overflow-hidden rounded-card bg-line shadow-card sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3.5 bg-surface p-5">
                <f.icon className="mt-0.5 size-[18px] shrink-0 text-ink-subtle" aria-hidden />
                <div className="min-w-0">
                  <dt className="eyebrow">{f.label}</dt>
                  <dd className="mt-1 text-[15px] font-medium">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {e.link_url && (
            <a href={e.link_url} target="_blank" rel="noopener noreferrer" className="card card-hover group flex items-center gap-4 p-4">
              <span className="grid size-10 place-items-center rounded-tile bg-sunken text-ink-2">
                <LinkIcon className="size-[17px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">More from the organizer</span>
                <span className="block truncate font-mono text-[12px] text-ink-muted">{linkLabel(e.link_url)}</span>
              </span>
              <ArrowUpRight className="size-4 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </a>
          )}

          {e.description && (
            <section aria-labelledby="about-h">
              <h2 id="about-h" className="text-h3 font-semibold">
                About this event
              </h2>
              <div className="mt-4 max-w-prose whitespace-pre-line text-[16px] leading-[1.7] text-ink-2">{e.description}</div>
            </section>
          )}

          {photos.view && (photoCount > 0 || photos.manage) && (
            <Link href={`/events/${e.slug}/photos`} className="card card-hover group flex items-center gap-4 p-5">
              <span className="grid size-11 place-items-center rounded-tile bg-sunken text-ink-2">
                <Camera className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-h4 font-semibold">Photos</span>
                <span className="block text-[13px] text-ink-muted">
                  {photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "No photos yet"}
                  {photos.manage ? " · add photos" : " · find yourself and save them to your Vault"}
                </span>
              </span>
              <ChevronRight className="size-5 text-ink-subtle transition-transform duration-base ease-out group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}

          {e.status === "published" && e.access === "public" && (
            <section aria-label="Share" className="border-t border-line pt-8">
              <ShareEvent url={shareUrl} title={e.title} />
            </section>
          )}
        </div>

        {/* Ticket panel */}
        <aside aria-label="Registration" className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="card overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[26px] font-medium tracking-[-0.04em] tabular-nums">{e.price_paise ? formatINR(e.price_paise) : "Free"}</p>
                <p className="text-[13px] text-ink-muted">
                  {e.capacity === null ? (
                    "No seat limit"
                  ) : (
                    <>
                      <span className={d.seatsLeft === 0 ? "font-mono font-medium text-danger" : "font-mono text-ink"}>{d.seatsLeft}</span> of{" "}
                      <span className="font-mono tabular-nums">{e.capacity}</span> left
                    </>
                  )}
                </p>
              </div>
              {e.capacity !== null && <Meter value={e.taken} max={e.capacity} className="mt-3" />}
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                <Users className="size-3.5" aria-hidden /> <span className="font-mono tabular-nums text-ink">{e.taken}</span> going
              </p>
            </div>
            <div className="ticket-cut" />
            <div className="space-y-4 p-5 pt-3 md:p-6 md:pt-3">
              {!viewer ? (
                <div className="space-y-3">
                  <LinkButton href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} variant="accent" size="lg" className="w-full">
                    Log in to register
                  </LinkButton>
                  <p className="text-center text-[13px] text-ink-muted">
                    New here?{" "}
                    <Link href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`} className="link">
                      Create an account
                    </Link>
                  </p>
                </div>
              ) : d.isOwner ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-ink-muted">
                    You&apos;re hosting this event
                    {e.access === "code" && e.access_code ? (
                      <>
                        {" "}
                        · join code <span className="font-mono font-medium tracking-[0.12em] text-ink">{e.access_code}</span>
                      </>
                    ) : null}
                    .
                  </p>
                  <div className="grid gap-2">
                    {e.status === "published" && (
                      <LinkButton href={`/organizer/scan/${e.id}`} size="lg" className="w-full">
                        <ScanLine className="size-4" aria-hidden /> Open gate scanner
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
              {viewer && reg && reg.status !== "cancelled" && viewer.phone && !viewer.whatsappOptIn && <WhatsAppPrompt phone={viewer.phone} />}
            </div>
          </div>
        </aside>
      </div>
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
