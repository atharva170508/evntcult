import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brandQr } from "@/lib/qr-art";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CalendarPlus,
  Camera,
  ChevronRight,
  Link as LinkIcon,
  MapPin,
  Megaphone,
  Navigation,
  Pencil,
  ScanLine,
  Video,
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { getViewer } from "@/lib/rbac";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { passQrPayload } from "@/lib/tokens";
import { formatINR, upiUri } from "@/lib/money";
import { directionsUrl, linkLabel } from "@/lib/organizer/shared";
import { fmtDate, fmtRange, fmtTime, relative } from "@/lib/utils";
import { Entrance } from "@/components/motion/MaskedLines";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { RegisterPanel } from "@/components/events/RegisterPanel";
import { photoAccess } from "@/lib/data/photos";
import { getDB } from "@/lib/db";
import { siteHost } from "@/lib/organizer/page-data";
import { listQuestions } from "@/lib/data/questions";
import { ShareEvent } from "@/components/events/ShareEvent";
import { WhatsAppPrompt } from "@/components/events/WhatsAppPrompt";
import { InterestedButton } from "@/components/events/InterestedButton";
import { CategoryPills, CategorySections, categorySectionList } from "@/components/events/CategoryFacts";
import { EventSectionNav } from "@/components/events/EventSectionNav";
import { ReadMore } from "@/components/events/ReadMore";
import { parsePromos, parseTiers } from "@/lib/tickets";
import { tierSeatsLeft } from "@/lib/data/pricing";
import { myTeam } from "@/lib/data/teams";
import { kindFor, parseConfig, teamMode } from "@/lib/categories";
import { buttonClass } from "@/components/ui/Button";
import { Odometer } from "@/components/ui/Odometer";
import { GuestWall } from "@/components/events/GuestWall";
import { FollowHost, ReportEvent } from "@/components/events/HostActions";
import { TITLE_FONTS, parseLook } from "@/lib/effects";
import { EventEffect } from "@/components/events/EventEffect";
import { EventCard } from "@/components/landing/EventCard";
import { listEvents } from "@/lib/data/events";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event" };

const LABEL: Record<string, string> = {
  GAMING: "Gaming",
  SPORTS: "Sports",
  TECH: "Tech",
  CULTURAL: "Cultural",
  WORKSHOP: "Workshop",
  TALK: "Talk",
  PARTY: "Party",
};

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string; team?: string }>;
}) {
  const [{ slug }, { code, team: teamCode }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  const d = await getEventDetail(slug, viewer, code);
  if (!d) notFound();

  const e = d.event;
  const s = toSummary(e);
  const reg = d.myRegistration;
  const ended = new Date(e.ends_at) <= new Date();
  const qrSvg =
    reg?.status === "registered"
      ? brandQr(passQrPayload(reg.pass_token), { kind: "pass", accent: accentHex(s.accent) })
      : null;

  // What this guest owes: their ticket type or promo price, else the event price.
  const owe = reg?.amount_paise ?? e.price_paise;
  const upiUrl =
    reg?.status === "registered" &&
    owe > 0 &&
    reg.payment_status !== "paid" &&
    e.organizer_upi_id
      ? upiUri({
          vpa: e.organizer_upi_id,
          payeeName: e.title,
          amountPaise: owe,
          note: reg.pass_code,
        })
      : null;
  const upiQr = upiUrl
    ? brandQr(upiUrl, { kind: "upi" })
    : null;

  const waitlistPosition =
    reg?.status === "waitlisted" ? await waitlistPos(e.id, reg.id) : null;
  const db = await getDB();
  const photos = await photoAccess(db, viewer, e.id);
  const [questions, host] = await Promise.all([
    listQuestions(db, e.id),
    siteHost(),
  ]);
  const shareUrl = `${host.startsWith("localhost") ? "http" : "https"}://${host}/e/${e.slug}`;
  const [hostRow, going, updates, saves] = await Promise.all([
    db
      .prepare(
        `SELECT u.name, u.created_at,
                (SELECT COUNT(*) FROM events x WHERE x.organizer_id = u.id AND x.status IN ('published','closed')) AS hosted,
                (SELECT COUNT(*) FROM registrations r JOIN events x ON x.id = r.event_id WHERE x.organizer_id = u.id AND r.status = 'registered') AS guests,
                (SELECT COUNT(*) FROM host_follows f WHERE f.host_id = u.id) AS followers,
                (SELECT COUNT(*) FROM host_follows f WHERE f.host_id = u.id AND f.user_id = ?) AS mine
           FROM users u WHERE u.id = ?`,
      )
      .bind(viewer?.id ?? "", e.organizer_id)
      .first<{ name: string; created_at: string; hosted: number; guests: number; followers: number; mine: number }>(),
    db
      .prepare(
        `SELECT u.name FROM registrations r JOIN users u ON u.id = r.user_id
          WHERE r.event_id = ? AND r.status = 'registered' ORDER BY r.created_at LIMIT 6`,
      )
      .bind(e.id)
      .all<{ name: string }>(),
    db
      .prepare(
        "SELECT id, kind, body, created_at FROM event_updates WHERE event_id = ? ORDER BY created_at DESC LIMIT 5",
      )
      .bind(e.id)
      .all<{ id: string; kind: string; body: string; created_at: string }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS n, SUM(user_id = ?) AS mine FROM event_saves WHERE event_id = ?",
      )
      .bind(viewer?.id ?? "", e.id)
      .first<{ n: number; mine: number | null }>(),
  ]);
  const interested = saves?.n ?? 0;
  const iSaved = !!saves?.mine;
  const goingInitials = (going.results ?? []).map((g) => initials(g.name));
  const photoCount = photos.view
    ? ((
        await db
          .prepare("SELECT COUNT(*) AS n FROM photos WHERE event_id = ?")
          .bind(e.id)
          .first<{ n: number }>()
      )?.n ?? 0)
    : 0;

  const kind = e.category ? (LABEL[e.category] ?? e.category) : "Event";
  const tierList = parseTiers(e.tiers);
  const look = parseLook(e.look);
  const fromPaise = tierList.length ? Math.min(...tierList.map((t) => t.pricePaise)) : e.price_paise;
  const priceLabel = fromPaise ? `${tierList.length > 1 ? "From " : ""}${formatINR(fromPaise)}` : tierList.length > 1 ? "From free" : "Free";
  const canRegister =
    !!viewer && !d.isOwner && !reg && e.status === "published" && !ended;
  const isPublic = e.status === "published" && e.access === "public";
  const teamRules = teamMode(kindFor(e.category), parseConfig(e.category_config));
  const viewerTeam = teamRules && reg && reg.status !== "cancelled" ? await myTeam(await getDB(), reg.id, viewer?.id ?? "") : null;
  const related = ended
    ? []
    : await (async () => {
        const same = (await listEvents({ type: e.category as never })).events.filter((x) => x.id !== e.id);
        const rest = same.length >= 3 ? [] : (await listEvents({})).events.filter((x) => x.id !== e.id && !same.some((y) => y.id === x.id));
        return [...same, ...rest].slice(0, 3);
      })();
  const pageSections = [
    ...((updates.results ?? []).length ? [{ id: "updates", label: "Updates" }] : []),
    ...(e.description ? [{ id: "about", label: "About" }] : []),
    ...(e.agenda ? [{ id: "agenda", label: "Agenda" }] : []),
    ...categorySectionList(e.category, e.category_config),
    ...(e.status !== "draft" ? [{ id: "wall", label: "Wall" }] : []),
  ];
  const regClosed = !!e.reg_closes_at && Date.parse(e.reg_closes_at) <= Date.now();
  const canSell = e.status === "published" && !ended && !regClosed;
  const confirmedVenue =
    e.event_type !== "virtual" && e.venue && e.venue_status === "confirmed";

  const cover = (cls: string) => (
    <div
      className={`relative aspect-square overflow-hidden rounded-[20px] bg-sunken ${cls}`}
    >
      <EventArt accent={s.accent} seed={s.id} scrim={false} />
      {e.banner_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.banner_url}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        </>
      )}
    </div>
  );

  /** Host, who's going, and the event's links. Left column on desktop, bottom of the page on phones. */
  const side = (cls: string) => (
    <div className={cls}>
      <div className="border-b border-line pb-5">
        <p className="text-[13px] font-medium text-ink-muted">Hosted by</p>
        <Link
          href={`/hosts/${e.organizer_id}`}
          className="group -mx-2 mt-1.5 flex items-center gap-3 rounded-lg p-2 transition-colors duration-fast hover:bg-sunken"
        >
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white"
            aria-hidden
          >
            {initials(hostRow?.name ?? "EvntCult")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">
              {hostRow?.name ?? "EvntCult"}
            </p>
            {!!hostRow?.hosted && (
              <p className="text-[13px] tabular-nums text-ink-muted">
                {hostRow.hosted} {hostRow.hosted === 1 ? "event" : "events"}{" "}
                hosted
              </p>
            )}
          </div>
          <ChevronRight
            className="size-4 shrink-0 text-ink-subtle"
            aria-hidden
          />
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12.5px] tabular-nums text-ink-muted">
            {[
              hostRow?.followers ? `${hostRow.followers.toLocaleString("en-IN")} ${hostRow.followers === 1 ? "follower" : "followers"}` : null,
              hostRow?.guests ? `${hostRow.guests.toLocaleString("en-IN")} guests hosted` : null,
              hostRow?.created_at ? `since ${new Date(hostRow.created_at).getFullYear()}` : null,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <FollowHost hostId={e.organizer_id} initial={!!hostRow?.mine} signedIn={!!viewer} self={viewer?.id === e.organizer_id} />
        </div>
      </div>

      <div className="border-b border-line py-5">
        <p className="text-[13px] font-medium text-ink-muted">
          <span className="font-semibold tabular-nums text-ink">{e.taken}</span>{" "}
          going
          {interested > 0 && (
            <>
              ,{" "}
              <span className="font-semibold tabular-nums text-ink">
                {interested}
              </span>{" "}
              interested
            </>
          )}
        </p>
        {goingInitials.length > 0 ? (
          <div className="mt-2.5 flex items-center">
            <div className="avstack flex -space-x-2">
              {goingInitials.map((ini, i) => (
                <span
                  key={i}
                  className="relative grid size-9 place-items-center rounded-full border-2 border-canvas text-[12px] font-semibold text-ink"
                  style={{ background: AVATAR_TINTS[i % AVATAR_TINTS.length], ["--i" as string]: i }}
                  aria-hidden
                >
                  {ini}
                </span>
              ))}
            </div>
            {e.taken > goingInitials.length && (
              <span className="ml-2.5 text-[13px] tabular-nums text-ink-muted">
                +{e.taken - goingInitials.length} more
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-[14px] text-ink-2">
            {ended ? "Nobody registered." : "Be the first to register."}
          </p>
        )}
      </div>

      {((photos.view && (photoCount > 0 || photos.manage)) || !!e.link_url) && (
        <ul className="py-2">
          {photos.view && (photoCount > 0 || photos.manage) && (
            <li>
              <SideLink
                href={`/events/${e.slug}/photos`}
                icon={Camera}
                label="Photos"
                note={
                  photoCount
                    ? `${photoCount}`
                    : photos.manage
                      ? "Add"
                      : undefined
                }
              />
            </li>
          )}
          {e.link_url && (
            <li>
              <SideLink
                href={e.link_url}
                icon={LinkIcon}
                label={linkLabel(e.link_url)}
                external
              />
            </li>
          )}
        </ul>
      )}
      {isPublic && (
        <div className="pt-5">
          <ShareEvent url={shareUrl} title={e.title} />
        </div>
      )}
      <div className="mt-3 border-t border-line pt-1">
        <ReportEvent slug={e.slug} />
      </div>
    </div>
  );

  return (
    <div className="relative isolate pb-28 pt-6 md:pb-12 md:pt-10">
      {/* Luma-style: the page picks up the event's colour (from the flyer when there is one) and breathes slowly. */}
      {look.style === "ruled" && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgb(var(--c-line))_1px,transparent_1px)] [background-size:100%_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      )}
      {look.style === "dots" && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(rgb(var(--c-line-strong))_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      )}
      <EventEffect effect={e.effect ?? null} />
      <Link
        href="/events"
        className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors duration-fast hover:text-ink md:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden /> Events
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Left: cover, host, going (desktop) */}
        <aside
          aria-label="Host and guests"
          className="hidden lg:sticky lg:top-[calc(var(--header-h)+40px)] lg:block lg:self-start"
        >
          <Entrance delay={0.04}>
            {cover("shadow-[0_24px_48px_-28px_rgba(60,40,10,0.45)]")}
          </Entrance>
          {side("mt-6")}
        </aside>

        {/* Right: what, when, where, register, about */}
        <div className="min-w-0">
          <Entrance delay={0.02} className="mt-2 lg:hidden">
            {cover("aspect-[4/3] sm:aspect-[2/1]")}
          </Entrance>

          <Entrance delay={0.06} className="mt-6 lg:mt-0">
            <p className="text-[14.5px] text-ink-muted">
              <Link href={`/events?type=${e.category}`} className="font-medium text-ink-2 hover:text-ink hover:underline">
                {kind}
              </Link>
              {e.access === "code" && <>, private (code only)</>}
              {e.status === "draft" && <span className="font-semibold text-warn">. Draft: only you can see this</span>}
              {e.status === "cancelled" && <span className="font-semibold text-danger">. Cancelled</span>}
              {ended && e.status !== "cancelled" && <span className="font-semibold text-ink">. This event has ended</span>}
            </p>
            <h1 className={`mt-2 text-[40px] leading-[1.02] text-ink md:text-[52px] ${TITLE_FONTS[look.font].cls}`}>
              {e.title}
            </h1>
            {s.tagline && (
              <p className="mt-3 max-w-[52ch] text-[17px] leading-snug text-ink-2">
                {s.tagline}
              </p>
            )}
            <CategoryPills category={e.category} raw={e.category_config} />
          </Entrance>

          {/* When and where, as tiles */}
          <dl className="mt-7 space-y-4">
            <div className="flex items-center gap-4">
              <dt className="sr-only">When</dt>
              <span
                className="flex w-12 shrink-0 flex-col overflow-hidden rounded-lg border border-line-strong bg-white text-center leading-none"
                aria-hidden
              >
                <span className="bg-sunken py-1 text-[10.5px] font-semibold text-ink-muted">
                  {fmtDate(s.startsAt, { month: "short" })}
                </span>
                <span className="py-1.5 font-display text-[20px] tabular-nums text-ink">
                  {fmtDate(s.startsAt, { day: "numeric" })}
                </span>
              </span>
              <dd className="min-w-0">
                <p className="text-[16px] font-semibold text-ink">
                  {fmtDate(s.startsAt, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-[14.5px] tabular-nums text-ink-muted">
                  {fmtRange(s.startsAt, s.endsAt)} IST
                </p>
              </dd>
            </div>
            <div className="flex items-center gap-4">
              <dt className="sr-only">Where</dt>
              <span
                className="grid w-12 shrink-0 place-items-center text-ink"
                aria-hidden
              >
                {e.event_type === "virtual" ? (
                  <Video className="size-5" strokeWidth={1.75} />
                ) : (
                  <MapPin className="size-5" strokeWidth={1.75} />
                )}
              </span>
              <dd className="min-w-0">
                {e.event_type === "virtual" ? (
                  <>
                    <p className="text-[16px] font-semibold text-ink">Online</p>
                    <p className="text-[14.5px] text-ink-muted">
                      {e.meeting_url &&
                      (d.isOwner || reg?.status === "registered") ? (
                        <a
                          href={e.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          Open the join link
                        </a>
                      ) : (
                        "The join link is on your pass"
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="truncate text-[16px] font-semibold text-ink">
                      {e.venue ?? "Venue to be announced"}
                    </p>
                    {confirmedVenue ? (
                      <a
                        href={directionsUrl({
                          venue: e.venue!,
                          venue_place_id: e.venue_place_id,
                          venue_lat: e.venue_lat,
                          venue_lng: e.venue_lng,
                        })}
                        target="_blank"
                        rel="noopener"
                        className="-my-3 inline-flex min-h-11 items-center gap-1 text-[14.5px] text-ink-muted transition-colors duration-fast hover:text-ink"
                      >
                        <Navigation className="size-3.5" aria-hidden />{" "}
                        {e.venue_address ?? "Get directions"}
                      </a>
                    ) : (
                      <p className="text-[14.5px] text-ink-muted">
                        The host will confirm the venue
                      </p>
                    )}
                  </>
                )}
              </dd>
            </div>
          </dl>

          {/* Registration */}
          <section
            id="register"
            aria-labelledby="reg-h"
            className="mt-8 scroll-mt-28 overflow-hidden rounded-[20px] border border-line-strong bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken/50 px-5 py-3">
              <h2 id="reg-h" className="text-[14px] font-semibold text-ink">
                {d.isOwner
                  ? "Your event"
                  : reg?.status === "registered"
                    ? "You're going"
                    : "Registration"}
              </h2>
              <p className="text-[13.5px] tabular-nums text-ink-muted">
                {e.capacity === null ? (
                  `${e.taken} going`
                ) : d.seatsLeft === 0 ? (
                  <span className="font-semibold text-danger">Full</span>
                ) : (
                  <>
                    <Odometer value={d.seatsLeft ?? 0} className="font-semibold text-ink" /> of {e.capacity} seats left
                  </>
                )}
              </p>
            </div>
            <div className="p-5">
              {!reg && !d.isOwner && canSell && (
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <p className="font-display text-[30px] leading-none tabular-nums text-ink">
                    {priceLabel}
                  </p>
                  <p className="text-[13.5px] text-ink-muted">
                    {e.price_paise || tierList.some((t) => t.pricePaise > 0)
                      ? e.organizer_upi_id
                        ? "Pay by UPI after you register"
                        : "Pay at the desk"
                      : "No payment needed"}
                  </p>
                </div>
              )}
              {e.capacity !== null && !reg && !d.isOwner && canSell && (
                <Meter value={e.taken} max={e.capacity} className="mb-5" />
              )}
              {e.reg_closes_at && !regClosed && !reg && canSell && (
                <p className="-mt-2 mb-4 text-[13.5px] tabular-nums text-ink-muted">
                  Registration closes {fmtDate(new Date(e.reg_closes_at), { weekday: "short", day: "numeric", month: "short" })}, {fmtTime(new Date(e.reg_closes_at))}
                </p>
              )}
              {!viewer ? (
                <div className="space-y-3">
                  <LinkButton
                    href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`}
                    variant="accent"
                    size="lg"
                    className="w-full"
                  >
                    Log in to register
                  </LinkButton>
                  <p className="text-center text-[14px] text-ink-muted">
                    New here?{" "}
                    <Link
                      href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`}
                      className="link"
                    >
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
                        . Code{" "}
                        <span className="font-mono font-medium tracking-[0.12em] text-ink">
                          {e.access_code}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {e.status === "published" && (
                      <LinkButton
                        href={`/organizer/scan/${e.id}`}
                        size="lg"
                        className="w-full"
                      >
                        <ScanLine className="size-4" aria-hidden /> Gate scanner
                      </LinkButton>
                    )}
                    <LinkButton
                      href={`/organizer/events/${e.id}/manage`}
                      variant="secondary"
                      size="lg"
                      className="w-full"
                    >
                      Manage
                    </LinkButton>
                    <LinkButton
                      href={`/organizer/events/${e.id}`}
                      variant="secondary"
                      size="lg"
                      className="w-full"
                    >
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </LinkButton>
                  </div>
                </div>
              ) : (
                <RegisterPanel
                  slug={e.slug}
                  code={code ?? null}
                  open={e.status === "published" && !ended && !regClosed}
                  approval={!!e.requires_approval}
                  teamSignup={teamRules ?? undefined}
                  myTeam={viewerTeam}
                  teamCode={teamCode}
                  tiers={tierList}
                  tierLeft={await tierSeatsLeft(e.id, e.tiers ?? null)}
                  hasPromos={parsePromos(e.promos).length > 0}
                  closedReason={
                    ended
                      ? "This event has ended."
                      : regClosed
                        ? "Registration has closed."
                      : e.status === "cancelled"
                        ? "This event was cancelled."
                        : e.status !== "published"
                          ? "Registration isn't open."
                          : null
                  }
                  full={d.seatsLeft === 0}
                  pricePaise={reg && reg.status !== "cancelled" ? owe : e.price_paise}
                  registration={
                    reg && reg.status !== "cancelled"
                      ? {
                          id: reg.id,
                          status: reg.status,
                          passCode: reg.pass_code,
                          paid: reg.payment_status === "paid",
                          checkedInAt: reg.checked_in_at
                            ? fmtTime(new Date(reg.checked_in_at))
                            : null,
                          holdExpiresAt: reg.hold_expires_at
                            ? fmtTime(new Date(reg.hold_expires_at))
                            : null,
                          waitlistPosition,
                        }
                      : null
                  }
                  qrSvg={qrSvg}
                  hasUpi={!!e.organizer_upi_id}
                  questions={teamRules ? questions.filter((q) => !/team name|squad name/i.test(q.label)) : questions}
                  ticket={{
                    title: e.title,
                    dateLabel: fmtDate(s.startsAt, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    }),
                    timeLabel: fmtRange(s.startsAt, s.endsAt),
                    venue:
                      e.event_type === "virtual"
                        ? "Online"
                        : (e.venue ?? "Venue to be announced"),
                    holder: viewer.name,
                    accent: s.accent,
                    seed: s.id,
                  }}
                  upi={
                    upiUrl && upiQr && reg
                      ? {
                          regId: reg.id,
                          pricePaise: owe,
                          vpa: e.organizer_upi_id!,
                          uri: upiUrl,
                          qrSvg: upiQr,
                          utr: reg.upi_utr,
                          rejected: !!reg.upi_rejected_at,
                        }
                      : null
                  }
                />
              )}
              {viewer &&
                reg &&
                reg.status !== "cancelled" &&
                viewer.phone &&
                !viewer.whatsappOptIn && (
                  <div className="mt-4">
                    <WhatsAppPrompt phone={viewer.phone} />
                  </div>
                )}
            </div>
          </section>

          {/* Partiful-style secondary actions */}
          {(isPublic || (!reg && !d.isOwner && canSell)) && !ended && (
            <div className="mt-2 flex flex-wrap gap-1">
              {!reg && !d.isOwner && canSell && (
                <InterestedButton
                  slug={e.slug}
                  saved={iSaved}
                  signedIn={!!viewer}
                />
              )}
              {isPublic && (
                <a
                  href={`/api/events/${e.slug}/ics`}
                  download
                  className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[14.5px] font-semibold text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                >
                  <CalendarPlus className="size-[18px]" aria-hidden /> Add to
                  calendar
                </a>
              )}
            </div>
          )}

          <EventSectionNav sections={pageSections} />

          {/* Updates from the host */}
          {(updates.results ?? []).length > 0 && (
            <section id="updates" aria-labelledby="upd-h" className="mt-10 scroll-mt-36">
              <h2 id="upd-h" className="text-[20px] font-semibold text-ink">
                Updates from the host
              </h2>
              <ol className="mt-4 border-l border-line-strong">
                {(updates.results ?? []).map((u) => {
                  const Icon =
                    u.kind === "venue"
                      ? MapPin
                      : u.kind === "schedule"
                        ? CalendarClock
                        : Megaphone;
                  return (
                    <li key={u.id} className="relative pb-5 pl-6 last:pb-0">
                      <span
                        className="absolute -left-[13px] top-0 grid size-[26px] place-items-center rounded-full border border-line-strong bg-canvas text-ink-2"
                        aria-hidden
                      >
                        <Icon className="size-3.5" strokeWidth={1.75} />
                      </span>
                      <p className="text-[13px] text-ink-muted">
                        <span className="font-semibold text-ink">
                          {UPDATE_LABEL[u.kind] ?? "Update"}
                        </span>
                        , {relative(new Date(u.created_at))}
                      </p>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-2">
                        {u.body}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {e.description && (
            <section
              id="about"
              aria-labelledby="about-h"
              className="mt-10 scroll-mt-36 border-t border-line pt-8"
            >
              <h2 id="about-h" className="text-[20px] font-semibold text-ink">
                About this event
              </h2>
              <ReadMore>
                <div className="mt-4 max-w-prose whitespace-pre-line text-[16px] leading-[1.7] text-ink-2">{e.description}</div>
              </ReadMore>
            </section>
          )}

          {e.agenda && (
            <section id="agenda" aria-labelledby="agenda-h" className="mt-10 scroll-mt-36 border-t border-line pt-8">
              <h2 id="agenda-h" className="text-[20px] font-semibold text-ink">
                Agenda
              </h2>
              <ol className="relative mt-5 space-y-4 border-l border-line-strong pl-6">
                {e.agenda.split("\n").map((l, i) => {
                  const [when, ...what] = l.split(",");
                  const has = what.length > 0;
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[29px] top-[7px] size-2.5 rounded-full bg-canvas ring-2 ring-ink" aria-hidden />
                      {has ? (
                        <>
                          <span className="block text-[13.5px] font-semibold tabular-nums text-ink-muted">{when.trim()}</span>
                          <span className="block text-[16px] text-ink">{what.join(",").trim()}</span>
                        </>
                      ) : (
                        <span className="block text-[16px] text-ink">{l}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <CategorySections category={e.category} raw={e.category_config} />

          <section aria-labelledby="know-h" className="mt-10 border-t border-line pt-8">
            <h2 id="know-h" className="text-[20px] font-semibold text-ink">
              Good to know
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {[
                (() => {
                  const mins = Math.round((Date.parse(e.ends_at) - Date.parse(e.starts_at)) / 60000);
                  return mins >= 1440 ? `${Math.round(mins / 1440)} days` : mins >= 60 ? `${Math.round(mins / 60)} ${Math.round(mins / 60) === 1 ? "hour" : "hours"}` : `${mins} min`;
                })(),
                e.event_type === "virtual" ? "Online" : "In person",
                e.price_paise > 0 || tierList.length ? "Paid entry" : "Free entry",
                ...(e.requires_approval ? ["Host approves each guest"] : []),
                ...(e.capacity ? [`${e.capacity.toLocaleString("en-IN")} seats`] : []),
              ].map((t) => (
                <li key={t} className="rounded-lg bg-sunken px-3 py-1.5 text-[13.5px] font-medium text-ink-2">
                  {t}
                </li>
              ))}
            </ul>
            {(e.refund_policy || e.price_paise > 0 || tierList.length > 0) && (
              <div className="mt-5 rounded-2xl border border-line p-4">
                <p className="text-[14px] font-semibold text-ink">Refund policy</p>
                <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">
                  {e.refund_policy || "The host hasn't set a refund policy. Ask them before you pay if you're unsure."}
                </p>
              </div>
            )}
          </section>

          {e.status !== "draft" && (
            <section id="wall" aria-labelledby="wall-h" className="mt-10 scroll-mt-36 border-t border-line pt-8">
              <h2 id="wall-h" className="mb-4 text-[20px] font-semibold text-ink">
                Guest wall
              </h2>
              <GuestWall slug={e.slug} signedIn={!!viewer} registerHref={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} />
            </section>
          )}

          {confirmedVenue && e.venue_lat != null && e.venue_lng != null && (
            <section aria-labelledby="loc-h" className="mt-10 border-t border-line pt-8">
              <h2 id="loc-h" className="text-[20px] font-semibold text-ink">
                Location
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-ink">{e.venue}</p>
              {e.venue_address && <p className="text-[14px] text-ink-muted">{e.venue_address}</p>}
              <a
                href={directionsUrl({ venue: e.venue!, venue_place_id: e.venue_place_id, venue_lat: e.venue_lat, venue_lng: e.venue_lng })}
                target="_blank"
                rel="noopener"
                aria-label={`Open ${e.venue} in Maps`}
                className="group relative mt-4 block overflow-hidden rounded-2xl border border-line bg-sunken shadow-[var(--lift-1)]"
              >
                <span aria-hidden className="absolute inset-0 grid place-items-center bg-[radial-gradient(rgb(var(--c-line-strong))_1px,transparent_1px)] [background-size:16px_16px]">
                  <MapPin className="size-7 text-brand" />
                </span>
                <iframe
                  title={`Map of ${e.venue}`}
                  loading="lazy"
                  tabIndex={-1}
                  className="pointer-events-none relative h-56 w-full grayscale-[35%] transition-[filter] duration-300 group-hover:grayscale-0 dark:invert dark:hue-rotate-180"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${e.venue_lng - 0.006}%2C${e.venue_lat - 0.0035}%2C${e.venue_lng + 0.006}%2C${e.venue_lat + 0.0035}&layer=mapnik&marker=${e.venue_lat}%2C${e.venue_lng}`}
                />
                <span className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-[13px] font-semibold text-ink shadow-[var(--lift-2)]">
                  <Navigation className="size-3.5" aria-hidden /> Directions
                </span>
              </a>
            </section>
          )}

          {related.length > 0 && (
            <section aria-labelledby="more-h" className="mt-12 border-t border-line pt-8">
              <h2 id="more-h" className="text-[20px] font-semibold text-ink">
                More like this
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((r) => (
                  <EventCard key={r.id} e={r} />
                ))}
              </div>
            </section>
          )}

          {side("mt-10 border-t border-line pt-8 lg:hidden")}
        </div>
      </div>

      {/* Phones: price and the main action stay in reach. */}
      {(canRegister || !viewer) && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-line-strong bg-white px-gutter pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 lg:hidden">
          <div>
            <p className="text-[17px] font-semibold tabular-nums text-ink">
              {priceLabel}
            </p>
            <p className="text-[13px] tabular-nums text-ink-muted">
              {fmtDate(s.startsAt, { day: "numeric", month: "short" })},{" "}
              {e.capacity === null
                ? `${e.taken} going`
                : d.seatsLeft === 0
                  ? "full"
                  : `${d.seatsLeft} left`}
            </p>
          </div>
          <a
            href={
              viewer
                ? "#register"
                : `/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`
            }
            className="inline-flex h-12 items-center rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink"
          >
            {viewer
              ? d.seatsLeft === 0
                ? "Join waitlist"
                : "Register"
              : "Log in to register"}
          </a>
        </div>
      )}
    </div>
  );
}

const UPDATE_LABEL: Record<string, string> = {
  schedule: "Schedule change",
  venue: "Venue change",
  update: "Update",
};
const AVATAR_TINTS = [
  "#F0D7FF",
  "#FFE4C7",
  "#D6EEDF",
  "#FCD9DF",
  "#DCE7FB",
  "#F4EBC9",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (
      (parts[0]?.[0] ?? "") +
      (parts.length > 1 ? parts[parts.length - 1][0] : "")
    ).toUpperCase() || "?"
  );
}

function SideLink({
  href,
  icon: Icon,
  label,
  note,
  external,
  download,
}: {
  href: string;
  icon: typeof Camera;
  label: string;
  note?: string;
  external?: boolean;
  download?: boolean;
}) {
  const cls =
    "group -mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 text-[15px] text-ink transition-colors duration-fast hover:bg-sunken";
  const inner = (
    <>
      <Icon
        className="size-[18px] shrink-0 text-ink-2"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {note && (
        <span className="text-[13px] tabular-nums text-ink-muted">{note}</span>
      )}
      {external ? (
        <ArrowUpRight className="size-4 text-ink-subtle" aria-hidden />
      ) : (
        <ChevronRight className="size-4 text-ink-subtle" aria-hidden />
      )}
    </>
  );
  return external || download ? (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : { download: "" })}
      className={cls}
    >
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
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
