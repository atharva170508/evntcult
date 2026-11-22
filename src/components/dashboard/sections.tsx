import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  CalendarPlus,
  CalendarRange,
  CircleAlert,
  Clock,
  Cpu,
  FileText,
  Gamepad2,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic2,
  Music2,
  Navigation,
  Palette,
  Plus,
  ScanFace,
  ScanLine,
  Sparkles,
  Sun,
  Ticket,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import type { AnnouncementItem, EventSummary, NextUp, OrganizerPanel } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EventArt } from "@/components/ui/EventArt";
import { Meter } from "@/components/ui/Meter";
import { Avatars } from "@/components/ui/Avatars";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/Section";
import { Countdown } from "./Countdown";
import { LiveHeadcount } from "./LiveHeadcount";
import { formatINR } from "@/lib/money";
import { cn, fmtDate, fmtRange, fmtTime, relative } from "@/lib/utils";

export const CATEGORY_LABEL: Record<string, string> = {
  FEST: "Fest",
  PARTY: "Party",
  SPORTS: "Sports",
  GAMING: "Gaming",
  TECH: "Tech",
  CULTURAL: "Cultural",
  WORKSHOP: "Workshop",
  TALK: "Talk",
  OTHER: "Event",
};

/** Status badge: Sold out / Almost full / Today / Tomorrow. */
export function eventBadge(e: EventSummary): { label: string; tone: ChipTone } | null {
  if (e.capacity !== null && e.registered >= e.capacity) return { label: "Sold out", tone: "danger" };
  if (e.capacity !== null && e.registered / e.capacity >= 0.85) return { label: "Almost full", tone: "warn" };
  const hours = (+e.startsAt - Date.now()) / 3_600_000;
  if (hours > 0 && hours < 24) return { label: "Today", tone: "accent" };
  if (hours >= 24 && hours < 48) return { label: "Tomorrow", tone: "neutral" };
  return null;
}

/** Google Calendar "add event" link. */
function calendarLink(e: EventSummary) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${f(e.startsAt)}/${f(e.endsAt)}`, location: e.venueName ?? "" });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/* ─── Quick filters ─────────────────────────────────────────────────────── */

const TILES = [
  { href: "/events?when=today", label: "Today", icon: Sun },
  { href: "/events?when=weekend", label: "This weekend", icon: CalendarRange },
  { href: "/events?price=free", label: "Free", icon: BadgeIndianRupee },
  { href: "/events?type=GAMING", label: "Gaming", icon: Gamepad2 },
  { href: "/events?type=SPORTS", label: "Sports", icon: Trophy },
  { href: "/events?type=TECH", label: "Tech", icon: Cpu },
  { href: "/events?type=CULTURAL", label: "Cultural", icon: Palette },
  { href: "/events?type=PARTY", label: "Parties", icon: Music2 },
  { href: "/events?type=WORKSHOP", label: "Workshops", icon: Wrench },
  { href: "/events?type=TALK", label: "Talks", icon: Mic2 },
];

export function QuickTiles() {
  return (
    <nav aria-label="Quick filters" className="no-scrollbar -mx-gutter flex gap-2 overflow-x-auto px-gutter py-1">
      {TILES.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className="group flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface pl-3 pr-3.5 text-[13.5px] font-medium text-ink-2 shadow-card transition-[box-shadow,color,transform] duration-fast ease-out hover:-translate-y-px hover:text-ink hover:shadow-raised"
        >
          <t.icon className="size-[15px] text-ink-subtle transition-colors group-hover:text-ink" aria-hidden />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/* ─── Stats ─────────────────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        <Icon className="size-4 text-ink-subtle" />
      </div>
      <p className="mt-6 truncate font-mono text-[34px] font-medium leading-none tracking-[-0.05em] tabular-nums text-ink md:text-[40px]">{value}</p>
      {hint && <p className="mt-2 truncate text-[12.5px] text-ink-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card card-hover block min-w-0 p-5">
      {body}
    </Link>
  ) : (
    <div className="card min-w-0 p-5">{body}</div>
  );
}

/* ─── Next up ───────────────────────────────────────────────────────────── */

export function NextUpHero({ event }: { event: NextUp }) {
  const badge = eventBadge(event);
  return (
    <section aria-labelledby="next-up-title" className="card grid h-full overflow-hidden md:grid-cols-[1fr_1fr]">
      {/* Poster */}
      <Link href={`/events/${event.slug}`} className="group relative isolate flex min-h-[260px] flex-col justify-between overflow-hidden p-6 text-white md:min-h-[440px] md:p-7">
        <EventArt accent={event.accent} seed={event.id} />
        <div className="relative flex flex-wrap items-center gap-1.5">
          <Chip tone="white">Next up</Chip>
          <Chip tone="white">{CATEGORY_LABEL[event.category]}</Chip>
          {event.visibility === "CODE_ONLY" && <Chip tone="white">Private</Chip>}
        </div>
        <div className="relative">
          <p className="text-[12.5px] text-white/80">{fmtDate(event.startsAt, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h2 id="next-up-title" className="mt-2 text-display-md font-semibold">
            {event.title}
          </h2>
          {event.tagline && <p className="mt-2 max-w-sm text-[15px] text-white/85">{event.tagline}</p>}
        </div>
      </Link>

      {/* Details */}
      <div className="flex flex-col gap-6 p-6 md:p-7">
        <dl className="space-y-4">
          <InfoRow icon={Clock} title={fmtRange(event.startsAt, event.endsAt)} sub={fmtDate(event.startsAt, { weekday: "long", day: "numeric", month: "short" })} />
          {event.venueName && <InfoRow icon={MapPin} title={event.venueName} />}
        </dl>

        <div>
          <p className="eyebrow mb-2.5">Starts in</p>
          <Countdown to={event.startsAt} endsAt={event.endsAt} />
        </div>

        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <Avatars id={event.id} count={event.registered} />
            {badge && <Chip tone={badge.tone}>{badge.label}</Chip>}
          </div>
          {event.capacity && (
            <>
              <Meter value={event.registered} max={event.capacity} className="mt-3" />
              <p className="mt-2 text-[12.5px] text-ink-muted">
                <span className="font-mono tabular-nums text-ink">{Math.max(0, event.capacity - event.registered)}</span> spots left of{" "}
                <span className="font-mono tabular-nums">{event.capacity}</span>
              </p>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <LinkButton href={`/events/${event.slug}`} className="flex-1">
            View event <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
          <LinkButton href={`/venues?to=${event.slug}`} variant="secondary">
            <Navigation className="size-4" aria-hidden /> Directions
          </LinkButton>
          <a href={calendarLink(event)} target="_blank" rel="noreferrer" title="Add to Google Calendar" aria-label="Add to Google Calendar" className={buttonClass("secondary", "md", "w-10 px-0")}>
            <CalendarPlus className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-[17px] shrink-0 text-ink-2" />
      <div className="min-w-0">
        <dt className="sr-only">{Icon === Clock ? "Time" : "Venue"}</dt>
        <dd className="truncate text-[15px] font-medium">{title}</dd>
        {sub && <dd className="truncate text-[12.5px] text-ink-muted">{sub}</dd>}
      </div>
    </div>
  );
}

export function EmptyNextUp() {
  return (
    <section className="card relative isolate flex min-h-[360px] flex-col justify-between overflow-hidden p-7 md:p-9">
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_80%_at_100%_0%,black,transparent_70%)]" />
      <span className="eyebrow">Next up</span>
      <div>
        <h2 className="max-w-md text-display-md font-semibold">
          Nothing on your calendar yet.
        </h2>
        <p className="mt-3 max-w-sm text-body text-ink-muted">Find something worth showing up for. Your pass appears here the moment you register.</p>
        <LinkButton href="/events" className="mt-6">
          Browse events <ArrowRight className="size-4" aria-hidden />
        </LinkButton>
      </div>
    </section>
  );
}

/* ─── Organizer ─────────────────────────────────────────────────────────── */

export function OrgKpis({ data }: { data: OrganizerPanel }) {
  const registrations = data.hosted.reduce((a, h) => a + h.registered, 0);
  const collected = data.hosted.reduce((a, h) => a + h.paid * h.feePaise, 0);
  const pending = data.hosted.reduce((a, h) => a + h.pendingPayments, 0);
  const boxes = [
    { label: "Registrations", value: registrations.toLocaleString("en-IN"), hint: `across ${data.hosted.length} event${data.hosted.length === 1 ? "" : "s"}`, icon: Users, href: "/organizer" },
    { label: "Fees collected", value: formatINR(collected), hint: "from paid passes", icon: BadgeIndianRupee, href: "/organizer" },
    { label: "Checked in now", value: data.live ? data.live.checkedIn : 0, hint: data.live ? data.live.title : "No live event", icon: ScanLine, href: data.live ? `/organizer/scan/${data.live.id}` : undefined },
    { label: "Payments pending", value: pending, hint: "Follow up at the desk", icon: Ticket, href: "/organizer" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {boxes.map((b) => (
        <StatTile key={b.label} {...b} />
      ))}
    </div>
  );
}

export function OrganizerConsole({ data }: { data: OrganizerPanel }) {
  const hard = data.clashes.filter((c) => c.severity === "hard");
  const soft = data.clashes.filter((c) => c.severity === "soft");

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {data.live ? (
        <Card eyebrow="Live now" title="Gate headcount" className="lg:col-span-5" action={{ label: "Open scanner", href: `/organizer/scan/${data.live.id}` }}>
          <LiveHeadcount eventId={data.live.id} title={data.live.title} capacity={data.live.capacity} registered={data.live.registered} initial={data.live.checkedIn} />
        </Card>
      ) : (
        <Card eyebrow="Live now" title="No event running" className="lg:col-span-5">
          <div className="flex h-full min-h-[140px] items-center gap-4 rounded-tile bg-sunken/70 p-5">
            <ScanLine className="size-6 shrink-0 text-ink-subtle" aria-hidden />
            <p className="text-small text-ink-muted">When one of your events starts, live check-ins and the headcount ring appear here.</p>
          </div>
        </Card>
      )}

      <Card eyebrow="Your events" title="Registrations & fees" className="lg:col-span-7" action={{ label: "Manage", href: "/organizer" }}>
        {data.hosted.length === 0 ? (
          <EmptyState icon={Ticket} title="No events yet" action={{ label: "Create event", href: "/organizer/events/new" }} />
        ) : (
          <ul className="-mx-2 divide-y divide-line">
            {data.hosted.map((h) => (
              <li key={h.id} className="grid grid-cols-12 items-center gap-3 px-2 py-3">
                <div className="col-span-12 min-w-0 sm:col-span-5">
                  <Link href={`/organizer/events/${h.id}/manage`} className="block truncate text-[14.5px] font-medium hover:underline hover:decoration-line-strong hover:underline-offset-4">
                    {h.title}
                  </Link>
                  <p className="text-[12.5px] text-ink-subtle">
                    {fmtDate(h.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(h.startsAt)}
                  </p>
                </div>
                <div className="col-span-7 sm:col-span-4">
                  <div className="mb-1.5 flex justify-between font-mono text-[12px] tabular-nums">
                    <span className="text-ink">{h.registered}</span>
                    <span className="text-ink-subtle">/ {h.capacity ?? "∞"}</span>
                  </div>
                  <Meter value={h.registered} max={h.capacity} />
                </div>
                <div className="col-span-5 text-right sm:col-span-3">
                  {h.feePaise > 0 ? (
                    <>
                      <p className="font-mono text-[13px] font-medium tabular-nums">{formatINR(h.paid * h.feePaise)}</p>
                      {h.pendingPayments > 0 ? <p className="text-[12px] font-medium text-warn">{h.pendingPayments} pending</p> : <p className="text-[12px] text-ink-subtle">All settled</p>}
                    </>
                  ) : (
                    <Chip tone="outline">Free</Chip>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        eyebrow="Schedule check"
        title={data.clashes.length ? `${data.clashes.length} clash${data.clashes.length > 1 ? "es" : ""} in your drafts` : "No clashes"}
        className="lg:col-span-6"
      >
        {data.clashes.length === 0 ? (
          <p className="text-small text-ink-muted">No clashes.</p>
        ) : (
          <ul className="space-y-2">
            {[...hard, ...soft].map((c, i) => (
              <li key={i} className={cn("flex gap-3 rounded-tile p-3.5", c.severity === "hard" ? "bg-danger-soft" : "bg-warn-soft")}>
                {c.severity === "hard" ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />}
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">
                    {c.forEvent} <span className="font-normal text-ink-muted">vs</span> {c.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{c.reason}</p>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {fmtDate(c.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtRange(c.startsAt, c.endsAt)}
                    <span className={cn("font-medium", c.severity === "hard" ? "text-danger" : "text-warn")}>{c.severity === "hard" ? " · Blocks publishing" : " · Warning only"}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card eyebrow="Quick actions" title="Run your event" className="lg:col-span-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <QuickAction href="/organizer/events/new" icon={Plus} label="New event" primary />
          <QuickAction href={data.live ? `/organizer/scan/${data.live.id}` : "/organizer"} icon={ScanLine} label="Scan passes" hint={data.live ? data.live.title : "Pick an event"} />
          <QuickAction href="/organizer" icon={FileText} label="Attendees & CSV" />
          <QuickAction
            href={data.live ? `/organizer/events/${data.live.id}/manage` : data.hosted[0] ? `/organizer/events/${data.hosted[0].id}/manage` : "/organizer"}
            icon={Megaphone}
            label="Broadcast update"
            hint={data.live?.title ?? data.hosted[0]?.title ?? "Pick an event"}
          />
          <QuickAction href="/organizer#whatsapp" icon={MessageCircle} label="WhatsApp" />
          <QuickAction href="/calendar" icon={CalendarRange} label="Calendar" />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  hint,
  primary,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[112px] flex-col justify-between gap-4 rounded-tile p-3.5 transition-[background-color,box-shadow,transform] duration-fast ease-out active:scale-[0.98]",
        primary ? "bg-night text-white shadow-button hover:bg-night-3" : "bg-sunken/70 hover:bg-surface hover:shadow-raised",
      )}
    >
      <Icon className={cn("size-[18px]", primary ? "text-white" : "text-ink-2")} aria-hidden />
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium leading-tight">{label}</p>
        {hint && <p className={cn("mt-0.5 truncate text-[12px]", primary ? "text-white/65" : "text-ink-muted")}>{hint}</p>}
      </div>
    </Link>
  );
}

/* ─── Announcements ─────────────────────────────────────────────────────── */

const kindTone: Record<string, ChipTone> = { INFO: "neutral", SCHEDULE_CHANGE: "warn", VENUE_CHANGE: "warn", URGENT: "danger" };
const kindLabel: Record<string, string> = { INFO: "Update", SCHEDULE_CHANGE: "Schedule", VENUE_CHANGE: "Venue", URGENT: "Urgent" };

export function Announcements({ items }: { items: AnnouncementItem[] }) {
  return (
    <Card eyebrow="Live updates" title="From your organizers" className="h-full">
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-tile bg-sunken/70 p-4">
          <Megaphone className="size-5 shrink-0 text-ink-subtle" aria-hidden />
          <p className="text-small text-ink-muted">No updates yet.</p>
        </div>
      ) : (
        <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[4.5px] before:top-2 before:w-px before:bg-line">
          {items.map((a, i) => (
            <li key={a.id} className="relative pl-6">
              <span className={cn("absolute left-0 top-[7px] size-2.5 rounded-full ring-4 ring-surface", i === 0 ? "bg-accent" : "bg-line-strong")} aria-hidden />
              <div className="flex flex-wrap items-center gap-1.5">
                {i === 0 && <Chip tone="accent">New</Chip>}
                <Chip tone={kindTone[a.kind]}>{kindLabel[a.kind]}</Chip>
                <span className="text-[12px] text-ink-subtle">
                  {a.eventTitle} · {relative(a.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-[15px] font-medium leading-snug">{a.title}</p>
              <p className="mt-0.5 text-[13.5px] text-ink-muted">{a.body}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ─── Link cards ────────────────────────────────────────────────────────── */

export function LinkCard({
  href,
  eyebrow,
  title,
  icon: Icon,
  body,
}: {
  href: string;
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  body: string;
}) {
  return (
    <Link href={href} className="card card-hover group flex h-full flex-col p-6">
      <div className="flex items-start justify-between">
        <Icon className="size-[20px] text-ink-2" />
        <ArrowUpRight className="size-4 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </div>
      <p className="eyebrow mt-10">{eyebrow}</p>
      <p className="mt-1 text-h3 font-semibold">{title}</p>
      <p className="mt-1.5 text-small text-ink-muted">{body}</p>
    </Link>
  );
}

/* ─── Upcoming (mine) ───────────────────────────────────────────────────── */

export function DateBlock({ date, accent, className }: { date: Date; accent: string; className?: string }) {
  return (
    <div className={cn("relative isolate grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-center text-white", className)}>
      <EventArt accent={accent} />
      <div className="relative leading-none">
        <div className="text-[12.5px] ">{fmtDate(date, { month: "short" })}</div>
        <div className="mt-0.5 text-[18px] font-semibold tabular-nums">{fmtDate(date, { day: "numeric" })}</div>
      </div>
    </div>
  );
}

export function UpcomingList({ events }: { events: EventSummary[] }) {
  return (
    <Card eyebrow="Your calendar" title="Coming up" action={{ label: "Calendar", href: "/calendar" }} className="h-full">
      {events.length === 0 ? (
        <EmptyState icon={CalendarRange} title="Nothing coming up" action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/events/${e.slug}`} className="group flex items-center gap-3.5 rounded-tile p-2 transition-colors duration-fast hover:bg-sunken/70">
                <DateBlock date={e.startsAt} accent={e.accent} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-medium">{e.title}</p>
                  <p className="truncate text-[12.5px] text-ink-muted">
                    {fmtTime(e.startsAt)}
                    {e.venueName ? ` · ${e.venueName}` : ""}
                  </p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ─── Campus events ─────────────────────────────────────────────────────── */

export function CampusRail({ events }: { events: EventSummary[] }) {
  return (
    <section aria-labelledby="campus-heading">
      <SectionHeader
        id="campus-heading"
        eyebrow="Happening soon"
        title={
          <>
            Don&apos;t miss these.
          </>
        }
        actions={
          <LinkButton href="/events" variant="secondary" size="sm">
            Browse all <ArrowRight className="size-3.5" aria-hidden />
          </LinkButton>
        }
      />
      <div className="mt-6">
        {events.length === 0 ? (
          <EmptyState icon={CalendarRange} title="No upcoming events" />
        ) : (
          <div className="no-scrollbar -mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
            {events.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Event card: printed poster on top, details below. Whole card is one link (single tab stop). */
export function EventCard({ e }: { e: EventSummary }) {
  const badge = eventBadge(e);
  return (
    <article className="w-[272px] shrink-0 snap-start lg:w-auto">
      <Link href={`/events/${e.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
        <div className="relative isolate aspect-[16/10] overflow-hidden">
          <EventArt accent={e.accent} seed={e.id} />
          <div className="relative flex flex-wrap gap-1.5 p-3">
            <Chip tone="white">{CATEGORY_LABEL[e.category]}</Chip>
            {badge && <Chip tone={badge.tone === "accent" ? "dark" : "white"}>{badge.label}</Chip>}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[12.5px] text-ink-subtle">
            {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.startsAt)}
          </p>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.02em]">{e.title}</h3>
          {e.tagline && <p className="mt-1 line-clamp-1 text-[13px] text-ink-muted">{e.tagline}</p>}
          {e.venueName && (
            <p className="mt-2 flex items-center gap-1 text-[12.5px] text-ink-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{e.venueName}</span>
            </p>
          )}
          <div className="flex-1" />
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3.5">
            <Avatars id={e.id} count={e.registered} />
            <span className={cn("font-mono text-[13px] font-medium tabular-nums", e.feePaise > 0 ? "text-ink" : "text-live")}>{e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ─── Vault + navigator teasers ─────────────────────────────────────────── */

export function VaultTeaser({ photosOfYou, preview = [] }: { photosOfYou: number; preview?: string[] }) {
  const tiles = ["violet", "orange", "teal", "pink", "blue", "green"];
  return (
    <Card eyebrow="Photo Vault" title={photosOfYou === 1 ? "1 photo of you" : `${photosOfYou} photos of you`} action={{ label: "Open", href: "/vault" }} className="h-full">
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t, i) => (
          <div key={t} className={cn("relative isolate overflow-hidden rounded-xl bg-sunken", i === 0 ? "col-span-2 row-span-2" : "aspect-square")}>
            {preview[i] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/photos/${preview[i]}?size=thumb`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            ) : (
              <EventArt accent={t} intensity={0.6} className="opacity-30" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-muted">
        <ScanFace className="size-4 shrink-0 text-ink-2" aria-hidden /> Tap &ldquo;that&apos;s me&rdquo; on event photos to collect yours
      </p>
    </Card>
  );
}

export function NavigatorTeaser({ next }: { next: NextUp | null }) {
  return (
    <Card eyebrow="Venue Navigator" title={next?.venueName ?? "Find any venue"} action={{ label: "Map", href: "/venues" }} className="h-full">
      <div className="relative h-[150px] overflow-hidden rounded-tile bg-sunken">
        <svg viewBox="0 0 400 150" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g stroke="#E4E1DA" strokeWidth="10" strokeLinecap="round">
            <path d="M0 110 H400" />
            <path d="M130 0 V150" />
            <path d="M260 0 V150" />
          </g>
          <g fill="#FFFFFF" stroke="#E4E1DA">
            <rect x="20" y="18" width="90" height="70" rx="10" />
            <rect x="150" y="18" width="92" height="70" rx="10" />
            <rect x="282" y="18" width="100" height="70" rx="10" />
          </g>
          <path d="M60 128 C 120 128, 130 110, 140 100 S 250 105, 330 54" fill="none" stroke="#222222" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
          <circle cx="60" cy="128" r="6" fill="#FFFFFF" stroke="#222222" strokeWidth="2.5" />
          <circle cx="330" cy="54" r="7" fill="#E3264F" stroke="#FFFFFF" strokeWidth="3" />
        </svg>
      </div>
      <p className="mt-4 flex items-start gap-2 text-[13px] text-ink-muted">
        <Navigation className="mt-0.5 size-4 shrink-0 text-ink-2" aria-hidden />
        {next?.directions ?? "Search any hall, lab or ground and get walking directions from the main gate."}
      </p>
    </Card>
  );
}

export function UpiPending({ amountPaise }: { amountPaise: number }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-tile bg-warn-soft px-4 py-3 text-[13.5px]">
      <Sparkles className="size-4 shrink-0 text-warn" aria-hidden />
      <span className="text-ink-2">
        <span className="font-mono font-medium text-warn">{formatINR(amountPaise)}</span> due · UPI payments are coming soon. Pay the organizer at the desk for now.
      </span>
    </div>
  );
}
