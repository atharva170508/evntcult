import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getViewer } from "@/lib/rbac";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { passQrPayload } from "@/lib/tokens";
import { formatINR, upiUri } from "@/lib/money";
import { directionsUrl, linkLabel } from "@/lib/organizer/shared";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { RegisterPanel } from "@/components/events/RegisterPanel";
import { photoAccess } from "@/lib/data/photos";
import { getDB } from "@/lib/db";
import { siteHost } from "@/lib/organizer/page-data";
import { listQuestions } from "@/lib/data/questions";
import { ShareEvent } from "@/components/events/ShareEvent";
import { WhatsAppPrompt } from "@/components/events/WhatsAppPrompt";
import { TOKENS } from "@/styles/tokens";

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
      ? await QRCode.toString(passQrPayload(reg.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } })
      : null;

  const upiUrl =
    reg?.status === "registered" && e.price_paise > 0 && reg.payment_status !== "paid" && e.organizer_upi_id
      ? upiUri({ vpa: e.organizer_upi_id, payeeName: e.title, amountPaise: e.price_paise, note: reg.pass_code })
      : null;
  const upiQr = upiUrl ? await QRCode.toString(upiUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } }) : null;

  const waitlistPosition = reg?.status === "waitlisted" ? await waitlistPos(e.id, reg.id) : null;
  const db = await getDB();
  const photos = await photoAccess(db, viewer, e.id);
  const [questions, host] = await Promise.all([listQuestions(db, e.id), siteHost()]);
  const shareUrl = `${host.startsWith("localhost") ? "http" : "https"}://${host}/e/${e.slug}`;
  const photoCount = photos.view
    ? ((await db.prepare("SELECT COUNT(*) AS n FROM photos WHERE event_id = ?").bind(e.id).first<{ n: number }>())?.n ?? 0)
    : 0;

  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-line py-3">
      <dt className="text-label leading-6 text-ink-muted">{k}</dt>
      <dd className="min-w-0 text-body">{children}</dd>
    </div>
  );

  return (
    <div className="flex flex-col gap-12 pt-6">
      <Link href="/events" className="inline-flex w-fit items-center gap-2 text-body-sm text-ink-muted hover:text-ink">
        <span aria-hidden>←</span> All events
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-ink-muted">{e.category ? (LABEL[e.category] ?? e.category) : "Event"}</span>
          {e.access === "code" && <Chip>Private · code only</Chip>}
          {e.status === "draft" && <Chip tone="warn">Draft · only you can see this</Chip>}
          {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
        </div>
        <h1 className="max-w-[20ch] font-display text-display uppercase">{e.title}</h1>
        {s.tagline && <p className="max-w-prose text-body text-ink-muted">{s.tagline}</p>}
        <p className="font-mono text-body-sm">
          {fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long" })} · {fmtRange(s.startsAt, s.endsAt)} IST
        </p>
      </header>

      {e.banner_url && (
        // A real uploaded banner, shown as itself — nothing drawn over it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.banner_url} alt="" className="aspect-[3/1] w-full rounded-md border border-line object-cover" />
      )}

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-12">
          <dl className="border-t border-line">
            <Row k="Date">
              <span className="font-mono">{fmtDate(s.startsAt, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
            </Row>
            <Row k="Time">
              <span className="font-mono">{fmtRange(s.startsAt, s.endsAt)} IST</span>
            </Row>
            {e.event_type === "virtual" ? (
              <Row k="Where">
                Online{" "}
                {e.meeting_url && (d.isOwner || reg?.status === "registered") ? (
                  <a href={e.meeting_url} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
                    Join link
                  </a>
                ) : (
                  <span className="text-ink-muted">· the link is on your pass</span>
                )}
              </Row>
            ) : (
              <Row k="Where">
                {e.venue ?? "Venue TBA"}
                {e.venue && e.venue_status === "confirmed" && (
                  <a
                    href={directionsUrl({ venue: e.venue, venue_place_id: e.venue_place_id, venue_lat: e.venue_lat, venue_lng: e.venue_lng })}
                    target="_blank"
                    rel="noopener"
                    className="ml-3 text-label text-ink-muted underline underline-offset-4 hover:text-ink"
                  >
                    Directions ›
                  </a>
                )}
              </Row>
            )}
            {e.link_url && (
              <Row k="Link">
                <a href={e.link_url} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-body-sm underline underline-offset-4">
                  {linkLabel(e.link_url)}
                </a>
              </Row>
            )}
            <Row k="Price">
              {e.price_paise ? (
                <>
                  <span className="font-mono">{formatINR(e.price_paise)}</span>
                  <span className="text-ink-muted">
                    {e.organizer_upi_id ? (
                      <>
                        {" "}
                        · UPI to <span className="font-mono text-ink">{e.organizer_upi_id}</span>
                      </>
                    ) : (
                      " · pay at the desk"
                    )}
                  </span>
                </>
              ) : (
                "Free"
              )}
            </Row>
            <Row k="Seats">
              <span className="font-mono">
                {e.taken} going
                {e.capacity !== null && <span className={d.seatsLeft === 0 ? "text-bad" : "text-ink-muted"}> · {d.seatsLeft === 0 ? "full" : `${d.seatsLeft} of ${e.capacity} left`}</span>}
              </span>
              {e.capacity !== null && <Meter value={e.taken} max={e.capacity} className="mt-2 max-w-60" />}
            </Row>
          </dl>

          {e.description && (
            <section aria-labelledby="about-h">
              <h2 id="about-h" className="text-heading">
                About
              </h2>
              <div className="mt-3 max-w-prose whitespace-pre-line text-body text-ink-muted">{e.description}</div>
            </section>
          )}

          {photos.view && (photoCount > 0 || photos.manage) && (
            <Link href={`/events/${e.slug}/photos`} className="card lift flex items-center justify-between gap-4 p-4 sm:p-6">
              <span>
                <span className="block text-title">Photos</span>
                <span className="block text-body-sm text-ink-muted">
                  {photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "No photos yet"}
                  {photos.manage ? " · add photos" : " · tag yourself to save them to your Vault"}
                </span>
              </span>
              <span aria-hidden className="text-ink-subtle">
                ›
              </span>
            </Link>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-20">
          {!viewer ? (
            <div className="flex flex-col gap-3">
              <LinkButton href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} size="lg" className="w-full">
                Log in to register
              </LinkButton>
              <p className="text-body-sm text-ink-muted">
                New here?{" "}
                <Link href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`} className="font-semibold text-ink underline underline-offset-4">
                  Sign up
                </Link>{" "}
                with your email.
              </p>
            </div>
          ) : d.isOwner ? (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm text-ink-muted">
                You organize this event
                {e.access === "code" && e.access_code ? (
                  <>
                    {" "}
                    · join code <span className="font-mono text-ink">{e.access_code}</span>
                  </>
                ) : null}
                .
              </p>
              <div className="flex flex-wrap gap-2">
                {e.status === "published" && <LinkButton href={`/organizer/scan/${e.id}`}>Open gate scanner</LinkButton>}
                <LinkButton href={`/organizer/events/${e.id}`} variant="secondary">
                  Edit
                </LinkButton>
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
          {e.status === "published" && e.access === "public" && <ShareEvent url={shareUrl} title={e.title} />}
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
