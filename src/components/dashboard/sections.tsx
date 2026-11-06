import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BadgeIndianRupee,
  CalendarPlus,
  CalendarRange,
  Camera,
  CircleAlert,
  Clock,
  FileText,
  Gamepad2,
  Map as MapIcon,
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
  Cpu,
} from "lucide-react";
import type { AnnouncementItem, EventSummary, NextUp, OrganizerPanel } from "@/lib/data/types";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { EventArt } from "@/components/ui/EventArt";
import { Meter } from "@/components/ui/Meter";
import { Avatars } from "@/components/ui/Avatars";
import { LinkButton } from "@/components/ui/Button";
import { Countdown } from "./Countdown";
import { LiveHeadcount } from "./LiveHeadcount";
import { formatINR } from "@/lib/money";
import { AnimatedNumber, Spotlight, Stagger } from "@/components/motion/primitives";
import { cn, fmtDate, fmtRange, fmtTime, relative } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
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

/** Eventbrite-style status badge: Sold out / Almost full / Today / Free. */
function eventBadge(e: EventSummary): { label: string; tone: ChipTone } | null {
  if (e.capacity !== null && e.registered >= e.capacity) return { label: "Sold out", tone: "danger" };
  if (e.capacity !== null && e.registered / e.capacity >= 0.85) return { label: "Almost full", tone: "warn" };
  const hours = (+e.startsAt - Date.now()) / 3_600_000;
  if (hours > 0 && hours < 24) return { label: "Today", tone: "accent" };
  if (hours >= 24 && hours < 48) return { label: "Tomorrow", tone: "accent" };
  return null;
}

/** Google Calendar "add event" link (AllEvents "Add to Calendar" idea). */
function calendarLink(e: EventSummary) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${f(e.startsAt)}/${f(e.endsAt)}`, location: e.venueName ?? "" });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** Five tones only (Realtime Colors roles + status), instead of a pastel per tile. */
export const TONES = {
  brand: "bg-brand-soft text-brand-ink",
  accent: "bg-accent-soft text-accent",
  live: "bg-live-soft text-live",
  warn: "bg-warn-soft text-warn",
  neutral: "bg-canvas text-ink-2",
} as const;
export type Tone = keyof typeof TONES;

/* ─── Quick tiles (Humanitix tiles + KonfHub type chips + Meetup icon tabs) ─── */

const TILES: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; tone: Tone }[] = [
  { href: "/events?when=today", label: "Today", icon: Sun, tone: "accent" },
  { href: "/events?when=weekend", label: "This weekend", icon: CalendarRange, tone: "brand" },
  { href: "/events?price=free", label: "Free", icon: BadgeIndianRupee, tone: "live" },
  { href: "/events?type=GAMING", label: "Gaming", icon: Gamepad2, tone: "neutral" },
  { href: "/events?type=SPORTS", label: "Sports", icon: Trophy, tone: "neutral" },
  { href: "/events?type=TECH", label: "Tech", icon: Cpu, tone: "neutral" },
  { href: "/events?type=CULTURAL", label: "Cultural", icon: Palette, tone: "neutral" },
  { href: "/events?type=PARTY", label: "Parties", icon: Music2, tone: "neutral" },
  { href: "/events?type=WORKSHOP", label: "Workshops", icon: Wrench, tone: "neutral" },
  { href: "/events?type=TALK", label: "Talks", icon: Mic2, tone: "neutral" },
];

export function QuickTiles() {
  return (
    <Stagger className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" itemClassName="shrink-0">
      {TILES.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface py-2 pl-2 pr-4 text-[13.5px] font-semibold transition-[border-color,transform] duration-200 ease-apple hover:-translate-y-0.5 hover:border-line-strong active:scale-[0.98]"
        >
          <span className={cn("grid size-8 place-items-center rounded-xl", TONES[t.tone])}>
            <t.icon className="size-4" />
          </span>
          {t.label}
        </Link>
      ))}
    </Stagger>
  );
}

/* ─── Stats (Zoho Backstage number boxes) ─────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <Spotlight className="card h-full p-5">
      <div className="relative">
        <span className={cn("grid size-10 place-items-center rounded-2xl", TONES[tone])}>
          <Icon className="size-[18px]" />
        </span>
        <p className="mt-5 font-display text-[34px] font-bold leading-none tracking-tighter">
          {typeof value === "number" ? <AnimatedNumber value={value} /> : <span className="tabular-nums">{value}</span>}
        </p>
        <p className="mt-2 text-[13px] font-semibold text-ink-2">{label}</p>
        {hint && <p className="text-[12px] text-ink-subtle">{hint}</p>}
      </div>
    </Spotlight>
  );
}

/* ─── Next up hero (Luma two-column event page + Unstop countdown) ──────── */

export function NextUpHero({ event }: { event: NextUp }) {
  const badge = eventBadge(event);
  return (
    <section className="card grid overflow-hidden md:grid-cols-[1.05fr_1fr]">
      {/* Poster */}
      <div className="relative isolate flex min-h-[260px] flex-col justify-between p-6 text-white md:min-h-[420px] md:p-7">
        <EventArt accent={event.accent} />
        <div className="relative flex flex-wrap items-center gap-2">
          <Chip tone="dark">Next up</Chip>
          <Chip tone="white">{CATEGORY_LABEL[event.category]}</Chip>
          {event.visibility === "CODE_ONLY" && <Chip tone="white">Private</Chip>}
        </div>
        <div className="relative">
          <p className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-paper/80">
            {fmtDate(event.startsAt, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="mt-1 font-display text-[clamp(34px,4.6vw,54px)] font-bold leading-[0.98] tracking-tightest">{event.title}</h2>
          {event.tagline && <p className="mt-2 max-w-sm text-[16px] text-white/85">{event.tagline}</p>}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-5 p-6 md:p-7">
        <div className="space-y-3">
          <InfoRow icon={Clock} title={fmtRange(event.startsAt, event.endsAt)} sub={fmtDate(event.startsAt, { weekday: "long", day: "numeric", month: "short" })} />
          {event.venueName && <InfoRow icon={MapPin} title={event.venueName} sub="Tap Directions for the walking route" />}
        </div>

        <div>
          <p className="eyebrow mb-2">Starts in</p>
          <Countdown to={event.startsAt} endsAt={event.endsAt} />
        </div>

        <div className="rounded-2xl bg-canvas p-3.5">
          <div className="flex items-center justify-between gap-3">
            <Avatars id={event.id} count={event.registered} />
            {badge && <Chip tone={badge.tone}>{badge.label}</Chip>}
          </div>
          {event.capacity && (
            <>
              <Meter value={event.registered} max={event.capacity} className="mt-3 bg-surface" />
              <p className="mt-1.5 text-[12px] font-semibold text-ink-muted">
                {Math.max(0, event.capacity - event.registered)} spots left of {event.capacity}
              </p>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <LinkButton href={`/events/${event.slug}`} className="flex-1">
            View event <ArrowUpRight className="size-4" />
          </LinkButton>
          <LinkButton href={`/venues?to=${event.slug}`} variant="secondary">
            <Navigation className="size-4" /> Directions
          </LinkButton>
          <a
            href={calendarLink(event)}
            target="_blank"
            rel="noreferrer"
            title="Add to Google Calendar"
            className="grid size-[44px] place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink"
          >
            <CalendarPlus className="size-[18px]" />
          </a>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line">
        <Icon className="size-[18px] text-ink-2" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold">{title}</p>
        {sub && <p className="truncate text-[12.5px] text-ink-muted">{sub}</p>}
      </div>
    </div>
  );
}

export function EmptyNextUp() {
  return (
    <section className="card relative isolate flex min-h-[420px] flex-col items-start justify-end overflow-hidden p-9 text-paper">
      <EventArt accent="violet" intensity={0.8} />
      <div className="relative">
        <h2 className="font-display text-[44px] font-bold leading-[1] tracking-tightest">Nothing on your calendar.</h2>
        <p className="mt-2 text-[17px] text-white/85">Find something worth showing up for.</p>
        <LinkButton href="/events" variant="light" className="mt-6">
          Browse events
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
    { label: "Registrations", value: registrations, hint: `across ${data.hosted.length} events`, icon: Users, tone: "brand" as Tone },
    { label: "Fees collected", value: formatINR(collected), hint: "from paid passes", icon: BadgeIndianRupee, tone: "live" as Tone },
    { label: "Checked in now", value: data.live ? data.live.checkedIn : 0, hint: data.live ? data.live.title : "no live event", icon: ScanLine, tone: "accent" as Tone },
    { label: "Payments pending", value: pending, hint: "follow up at the desk", icon: Ticket, tone: "warn" as Tone },
  ];
  return (
    <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {boxes.map((b) => (
        <StatTile key={b.label} {...b} />
      ))}
    </Stagger>
  );
}

export function OrganizerConsole({ data }: { data: OrganizerPanel }) {
  const hard = data.clashes.filter((c) => c.severity === "hard");
  const soft = data.clashes.filter((c) => c.severity === "soft");

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {data.live ? (
        <Card eyebrow="Live now" title="Gate headcount" icon={ScanLine} className="lg:col-span-5" action={{ label: "Open scanner", href: `/organizer/scan/${data.live.id}` }}>
          <LiveHeadcount
            eventId={data.live.id}
            title={data.live.title}
            capacity={data.live.capacity}
            registered={data.live.registered}
            initial={data.live.checkedIn}
          />
        </Card>
      ) : (
        <Card eyebrow="Live now" title="No event running" icon={ScanLine} className="lg:col-span-5">
          <p className="text-[14px] text-ink-muted">When one of your events starts, live check-ins appear here.</p>
        </Card>
      )}

      <Card eyebrow="Your events" title="Registrations & fees" icon={Ticket} className="lg:col-span-7" action={{ label: "Manage", href: "/organizer" }}>
        <ul className="space-y-2">
          {data.hosted.map((h) => (
            <li key={h.id} className="grid grid-cols-12 items-center gap-3 rounded-2xl bg-canvas p-3">
              <div className="col-span-12 min-w-0 sm:col-span-5">
                <Link href={`/organizer/events/${h.id}`} className="block truncate text-[14.5px] font-bold hover:text-brand">
                  {h.title}
                </Link>
                <p className="text-[12px] text-ink-muted">
                  {fmtDate(h.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(h.startsAt)}
                </p>
              </div>
              <div className="col-span-7 sm:col-span-4">
                <div className="mb-1 flex justify-between text-[12px] font-semibold tabular-nums">
                  <span>{h.registered}</span>
                  <span className="text-ink-subtle">/ {h.capacity ?? "∞"}</span>
                </div>
                <Meter value={h.registered} max={h.capacity} className="bg-surface" />
              </div>
              <div className="col-span-5 text-right sm:col-span-3">
                {h.feePaise > 0 ? (
                  <>
                    <p className="text-[13px] font-bold tabular-nums">{formatINR(h.paid * h.feePaise)}</p>
                    {h.pendingPayments > 0 ? (
                      <p className="text-[11.5px] font-semibold text-warn">{h.pendingPayments} pending</p>
                    ) : (
                      <p className="text-[11.5px] text-ink-subtle">all settled</p>
                    )}
                  </>
                ) : (
                  <Chip tone="live">Free</Chip>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        eyebrow="Schedule check"
        title={data.clashes.length ? `${data.clashes.length} clash${data.clashes.length > 1 ? "es" : ""} in your drafts` : "No clashes"}
        icon={AlertTriangle}
        className="lg:col-span-6"
      >
        {data.clashes.length === 0 ? (
          <p className="text-[14px] text-ink-muted">Your drafts don&apos;t overlap any booked venue or major campus event.</p>
        ) : (
          <ul className="space-y-2.5">
            {[...hard, ...soft].map((c, i) => (
              <li key={i} className={cn("flex gap-3 rounded-2xl p-3.5", c.severity === "hard" ? "bg-danger-soft" : "bg-warn-soft")}>
                {c.severity === "hard" ? (
                  <CircleAlert className="mt-0.5 size-[18px] shrink-0 text-danger" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-warn" />
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-bold">
                    {c.forEvent} <span className="font-medium text-ink-muted">vs</span> {c.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{c.reason}</p>
                  <p className="mt-1 text-[12px] font-semibold text-ink-muted">
                    {fmtDate(c.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtRange(c.startsAt, c.endsAt)}
                    {c.severity === "hard" ? " · Blocks publishing" : " · Warning only"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card eyebrow="Quick actions" title="Run your event" icon={Sparkles} className="lg:col-span-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <QuickAction href="/organizer/events/new" icon={Plus} label="New event" primary />
          <QuickAction href={data.live ? `/organizer/scan/${data.live.id}` : "/organizer"} icon={ScanLine} label="Scan passes" hint={data.live ? data.live.title : "pick an event"} tone="accent" />
          <QuickAction href="/organizer" icon={FileText} label="Attendees & CSV" hint="payments, export" tone="warn" />
          <QuickAction
            href={data.live ? `/organizer/events/${data.live.id}` : data.hosted[0] ? `/organizer/events/${data.hosted[0].id}` : "/organizer"}
            icon={Megaphone}
            label="Broadcast update"
            hint={data.live?.title ?? data.hosted[0]?.title ?? "pick an event"}
            tone="brand"
          />
          <QuickAction href="/organizer#whatsapp" icon={MessageCircle} label="WhatsApp" hint="reminders queue automatically" tone="live" />
          <QuickAction planned icon={Award} label="Issue certificates" />
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
  planned,
  tone = "neutral",
}: {
  href?: string;
  planned?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  primary?: boolean;
  tone?: Tone;
}) {
  if (planned || !href) {
    return (
      <div aria-disabled="true" className="flex cursor-not-allowed flex-col justify-between gap-6 rounded-2xl border border-dashed border-line p-4 opacity-60">
        <span className="grid size-9 place-items-center rounded-xl bg-canvas text-ink-subtle">
          <Icon className="size-[18px]" />
        </span>
        <div>
          <p className="text-[13.5px] font-bold leading-tight">{label}</p>
          <p className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-wider text-ink-subtle">Planned</p>
        </div>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between gap-6 rounded-2xl border p-4 transition-all duration-200 ease-apple hover:-translate-y-0.5 active:scale-[0.98]",
        primary ? "border-transparent bg-ink text-ink-contrast hover:bg-ink/85" : "border-line bg-surface hover:border-ink",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-xl", primary ? "bg-ink-contrast/15 text-ink-contrast" : TONES[tone])}>
        <Icon className="size-[18px]" />
      </span>
      <div>
        <p className="text-[13.5px] font-bold leading-tight">{label}</p>
        {hint && <p className={cn("mt-0.5 text-[11.5px]", primary ? "text-ink-contrast/70" : "text-ink-muted")}>{hint}</p>}
      </div>
    </Link>
  );
}

/* ─── Announcements (Luma timeline) ─────────────────────────────────────── */

const kindTone: Record<string, ChipTone> = { INFO: "neutral", SCHEDULE_CHANGE: "accent", VENUE_CHANGE: "violet", URGENT: "danger" };
const kindLabel: Record<string, string> = { INFO: "Update", SCHEDULE_CHANGE: "Schedule", VENUE_CHANGE: "Venue", URGENT: "Urgent" };

export function Announcements({ items }: { items: AnnouncementItem[] }) {
  return (
    <Card eyebrow="Live updates" title="From your organizers" icon={Megaphone} className="h-full">
      {items.length === 0 ? (
        <p className="text-[14px] text-ink-muted">Updates from events you&apos;ve joined will show up here.</p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:bottom-1 before:left-[6px] before:top-1 before:w-0.5 before:rounded-full before:bg-line">
          {items.map((a, i) => (
            <li key={a.id} className="relative pl-7">
              <span className={cn("absolute left-0 top-1 size-[14px] rounded-full border-[3px] border-surface", i === 0 ? "bg-danger" : "bg-line-strong")} />
              <div className="flex flex-wrap items-center gap-2">
                {i === 0 && (
                  <Chip tone="danger" pulse>
                    New
                  </Chip>
                )}
                <Chip tone={kindTone[a.kind]}>{kindLabel[a.kind]}</Chip>
                <span className="text-[12px] font-semibold text-ink-subtle">
                  {a.eventTitle} · {relative(a.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 text-[15px] font-bold leading-snug">{a.title}</p>
              <p className="mt-0.5 text-[13.5px] text-ink-muted">{a.body}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ─── Planned features (honest, disabled) ───────────────────────────────── */

export function PlannedCard({
  eyebrow,
  title,
  icon,
  body,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  body: string;
}) {
  return (
    <Card eyebrow={eyebrow} title={title} icon={icon} className="h-full border-dashed">
      <span className="inline-block rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">Planned</span>
      <p className="mt-3 text-[13.5px] text-ink-muted">{body}</p>
    </Card>
  );
}

/* ─── Upcoming list (mine) ──────────────────────────────────────────────── */

export function UpcomingList({ events }: { events: EventSummary[] }) {
  return (
    <Card eyebrow="Your calendar" title="Coming up" icon={CalendarRange} action={{ label: "Calendar", href: "/calendar" }} className="h-full">
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/events/${e.slug}`} className="group flex items-center gap-3.5 rounded-2xl p-2 transition-colors hover:bg-canvas">
              <div className="relative isolate grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-center text-white">
                <EventArt accent={e.accent} />
                <div className="relative">
                  <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em]">{fmtDate(e.startsAt, { month: "short" })}</div>
                  <div className="font-display text-[20px] font-bold leading-none tabular-nums">{fmtDate(e.startsAt, { day: "numeric" })}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold">{e.title}</p>
                <p className="truncate text-[12.5px] text-ink-muted">
                  {fmtTime(e.startsAt)} · {e.venueName}
                </p>
              </div>
              <ArrowUpRight className="size-4 text-ink-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ─── Campus events (Eventbrite / AllEvents cards) ──────────────────────── */

export function CampusRail({ events }: { events: EventSummary[] }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Happening on campus</p>
          <h2 className="headline mt-1 text-[26px]">Don&apos;t miss these</h2>
        </div>
        <LinkButton href="/events" variant="secondary" className="py-2 text-[13px]">
          Browse all <ArrowUpRight className="size-4" />
        </LinkButton>
      </div>
      <Stagger
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4"
        itemClassName="flex shrink-0 snap-start lg:shrink"
      >
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </Stagger>
    </section>
  );
}

export function EventCard({ e }: { e: EventSummary }) {
  const badge = eventBadge(e);
  return (
    <article className="card lift group flex w-[280px] flex-col overflow-hidden lg:w-full">
      <Link href={`/events/${e.slug}`} className="relative isolate block h-[150px] overflow-hidden">
        <EventArt accent={e.accent} className="transition-transform duration-700 ease-apple group-hover:scale-[1.04]" />
        <div className="relative flex gap-1.5 p-3">
          <Chip tone="white">{CATEGORY_LABEL[e.category]}</Chip>
          {badge && <Chip tone={badge.tone}>{badge.label}</Chip>}
        </div>
        <div className="absolute bottom-2.5 left-3 font-display text-paper">
          <span className="text-[40px] font-bold leading-none tracking-tighter tabular-nums">{fmtDate(e.startsAt, { day: "numeric" })}</span>
          <span className="ml-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper/85">{fmtDate(e.startsAt, { month: "short" })}</span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.1em] text-brand">
          {fmtDate(e.startsAt, { weekday: "short" })} · {fmtTime(e.startsAt)}
        </p>
        <Link href={`/events/${e.slug}`} className="mt-1 font-display text-[18px] font-bold leading-snug tracking-tight transition-colors hover:text-brand">
          {e.title}
        </Link>
        {e.tagline && <p className="mt-1 line-clamp-1 text-[13px] text-ink-muted">{e.tagline}</p>}
        {e.venueName && (
          <p className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-ink-2">
            <MapPin className="size-3.5 text-ink-subtle" /> {e.venueName}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <Avatars id={e.id} count={e.registered} size={22} />
          <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-bold", e.feePaise > 0 ? "bg-ink text-ink-contrast" : "bg-live-soft text-live")}>
            {e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ─── Vault + navigator teasers ─────────────────────────────────────────── */

export function VaultTeaser({ photosOfYou }: { photosOfYou: number }) {
  const tiles = [0, 1, 2, 3, 4, 5];
  return (
    <Card eyebrow="Photo Vault" title={photosOfYou === 1 ? "1 photo of you" : `${photosOfYou} photos of you`} icon={Camera} action={{ label: "Open", href: "/vault" }} className="h-full">
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t, i) => (
          <div
            key={t}
            className={cn(
              "grid place-items-center rounded-2xl border border-dashed border-line-strong bg-canvas text-ink-subtle",
              i === 0 ? "col-span-2 row-span-2" : "aspect-square",
            )}
          >
            <Camera className={i === 0 ? "size-6" : "size-3.5"} />
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
        <ScanFace className="size-4 text-brand" /> Tap &ldquo;that&apos;s me&rdquo; on event photos to collect yours
      </p>
    </Card>
  );
}

export function NavigatorTeaser({ next }: { next: NextUp | null }) {
  return (
    <Card eyebrow="Venue Navigator" title={next?.venueName ?? "Find any venue"} icon={MapIcon} action={{ label: "Map", href: "/venues" }} className="h-full">
      <div className="relative h-[150px] overflow-hidden rounded-2xl bg-canvas">
        {/* Stylised campus map placeholder — swap for Mapbox/Leaflet or an SVG campus plan. */}
        <svg viewBox="0 0 400 150" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g stroke="rgb(var(--surface))" strokeWidth="10" strokeLinecap="round">
            <path d="M0 110 H400" />
            <path d="M130 0 V150" />
            <path d="M260 0 V150" />
          </g>
          <g fill="rgb(var(--line))">
            <rect x="20" y="18" width="90" height="70" rx="10" />
            <rect x="150" y="18" width="92" height="70" rx="10" />
            <rect x="282" y="18" width="100" height="70" rx="10" />
          </g>
          <circle cx="200" cy="52" r="18" fill="rgb(var(--live-soft))" />
          <path d="M60 128 C 120 128, 130 110, 140 100 S 250 105, 330 54" fill="none" stroke="rgb(var(--primary))" strokeWidth="3.5" strokeDasharray="7 6" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1s" repeatCount="indefinite" />
          </path>
          <circle cx="60" cy="128" r="7" fill="rgb(var(--text))" stroke="rgb(var(--surface))" strokeWidth="3" />
          <circle cx="330" cy="54" r="16" fill="rgb(var(--primary))" opacity="0.18" />
          <circle cx="330" cy="54" r="8" fill="rgb(var(--primary))" stroke="rgb(var(--surface))" strokeWidth="3" />
        </svg>
      </div>
      <p className="mt-4 flex items-start gap-2 text-[13px] font-semibold text-ink-muted">
        <Navigation className="mt-0.5 size-4 shrink-0 text-brand" />
        {next?.directions ?? "Search any hall, lab or ground and get walking directions from the main gate."}
      </p>
    </Card>
  );
}

export function UpiPending({ amountPaise }: { amountPaise: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-warn-soft p-3.5 text-[13px] font-semibold">
      <Sparkles className="size-4 shrink-0 text-warn" />
      <span className="text-ink-2">{formatINR(amountPaise)} due · UPI payments are coming soon. Pay the organizer at the desk for now.</span>
    </div>
  );
}
