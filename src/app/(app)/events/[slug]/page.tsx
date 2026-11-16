import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, Camera, CalendarDays, ChevronRight, Clock, MapPin, Pencil, ScanLine, Ticket, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { passQrPayload } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { EventArt } from "@/components/ui/EventArt";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { RegisterPanel } from "@/components/events/RegisterPanel";
import { LinkButton } from "@/components/ui/Button";
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
      ? await QRCode.toString(passQrPayload(reg.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111110", light: "#ffffff" } })
      : null;

  const waitlistPosition = reg?.status === "waitlisted" ? await waitlistPos(e.id, reg.id) : null;
  const db = await getDB();
  const photos = await photoAccess(db, viewer, e.id);
  const photoCount = photos.view
    ? ((await db.prepare("SELECT COUNT(*) AS n FROM photos WHERE event_id = ?").bind(e.id).first<{ n: number }>())?.n ?? 0)
    : 0;

  const statusChips = (
    <>
      <Chip tone="white">{LABEL[e.category] ?? e.category}</Chip>
      {e.access === "code" && <Chip tone="dark">Private · code only</Chip>}
      {e.status === "draft" && <Chip tone="warn">Draft · only you can see this</Chip>}
      {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
      {ended && e.status !== "cancelled" && <Chip tone="white">Ended</Chip>}
    </>
  );

  const facts = [
    { icon: CalendarDays, label: "Date", value: fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { icon: Clock, label: "Time", value: <>{fmtRange(s.startsAt, s.endsAt)} <span className="text-ink-subtle">IST</span></> },
    { icon: MapPin, label: "Venue", value: <Link href={`/venues?to=${e.slug}`} className="link">{e.venue}</Link> },
    { icon: Ticket, label: "Entry", value: e.price_paise ? `${formatINR(e.price_paise)} · pay at the desk` : "Free entry" },
  ];

  return (
    <div className="pb-8 pt-6 md:pt-8">
      <Link href="/events" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-4 transition-transform duration-base ease-out group-hover:-translate-x-0.5" aria-hidden /> All events
      </Link>

      {/* Poster */}
      <section className="relative isolate mt-5 flex min-h-[320px] animate-fade-up flex-col justify-between overflow-hidden rounded-panel p-6 text-white md:min-h-[460px] md:p-10">
        <EventArt accent={s.accent} />
        <div className="relative flex flex-wrap gap-1.5">{statusChips}</div>
        <div className="relative max-w-3xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/80">
            {fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(s.startsAt)}
          </p>
          <h1 className="mt-3 text-display-xl font-semibold">{e.title}</h1>
          {s.tagline && <p className="mt-4 max-w-xl text-[19px] leading-snug text-white/90">{s.tagline}</p>}
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
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

          {e.description && (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-h3 font-semibold">
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
                  {photos.manage ? " · add photos" : " · tag yourself to save them to your Vault"}
                </span>
              </span>
              <ChevronRight className="size-5 text-ink-subtle transition-transform duration-base ease-out group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>

        {/* Ticket panel */}
        <aside aria-label="Registration" className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="card overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[26px] font-medium tracking-[-0.04em] tabular-nums">{e.price_paise ? formatINR(e.price_paise) : "Free"}</p>
                <p className="text-[13px] text-ink-muted">
                  <span className={d.seatsLeft === 0 ? "font-mono font-medium text-danger" : "font-mono text-ink"}>{d.seatsLeft}</span> of{" "}
                  <span className="font-mono tabular-nums">{e.capacity}</span> left
                </p>
              </div>
              <Meter value={e.taken} max={e.capacity} className="mt-3" />
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                <Users className="size-3.5" aria-hidden /> <span className="font-mono tabular-nums text-ink">{e.taken}</span> going
              </p>
            </div>
            <div className="ticket-cut" />
            <div className="p-5 pt-3 md:p-6 md:pt-3">
              {!viewer ? (
                <div className="space-y-3">
                  <LinkButton href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} variant="accent" size="lg" className="w-full">
                    Log in to register
                  </LinkButton>
                  <p className="text-center text-[13px] text-ink-muted">
                    New here?{" "}
                    <Link href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`} className="link">
                      Sign up
                    </Link>{" "}
                    with your college email.
                  </p>
                </div>
              ) : d.isOwner ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-ink-muted">
                    You organize this event
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
                      <LinkButton href={`/organizer/events/${e.id}`} variant="secondary">
                        Manage
                      </LinkButton>
                      <LinkButton href={`/organizer/events/${e.id}/edit`} variant="secondary">
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
                />
              )}
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
