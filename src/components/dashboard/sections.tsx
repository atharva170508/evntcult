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

/* ─── Quick tiles (Humanitix tiles + KonfHub type chips + Meetup icon tabs) ─── */

const TILES = [
  { href: "/events?when=today", label: "Today", icon: Sun, color: "#fff3df", ink: "#b45309" },
  { href: "/events?when=weekend", label: "This weekend", icon: CalendarRange, color: "#efebff", ink: "#3b22d6" },
  { href: "/events?price=free", label: "Free", icon: BadgeIndianRupee, color: "#e2f7ee", ink: "#0b7f4f" },
  { href: "/events?type=GAMING", label: "Gaming", icon: Gamepad2, color: "#ffe4ec", ink: "#be123c" },
  { href: "/events?type=SPORTS", label: "Sports", icon: Trophy, color: "#e0f2fe", ink: "#0369a1" },
  { href: "/events?type=TECH", label: "Tech", icon: Cpu, color: "#ecfccb", ink: "#4d7c0f" },
  { href: "/events?type=CULTURAL", label: "Cultural", icon: Palette, color: "#fae8ff", ink: "#a21caf" },
  { href: "/events?type=PARTY", label: "Parties", icon: Music2, color: "#ffedd5", ink: "#c2410c" },
  { href: "/events?type=WORKSHOP", label: "Workshops", icon: Wrench, color: "#f1f5f9", ink: "#334155" },
  { href: "/events?type=TALK", label: "Talks", icon: Mic2, color: "#e0e7ff", ink: "#4338ca" },
];

export function QuickTiles() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 animate-fade-up lg:mx-0 lg:px-0">
      {TILES.map((t) => (
        <Link
          key={t.label}
          href={t.href}
          className="group flex shrink-0 items-center gap-2.5 rounded-2xl border border-line bg-surface py-2 pl-2 pr-4 text-[13.5px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-ink"
        >
          <span className="grid size-8 place-items-center rounded-xl" style={{ background: t.color, color: t.ink }}>
            <t.icon className="size-4" />
          </span>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/* ─── Stats (Zoho Backstage number boxes) ─────────────────────────────── */

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  color = "#efebff",
  ink = "#3b22d6",
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  ink?: string;
  delay?: number;
}) {
  return (
    <div className="card lift animate-fade-up p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-2xl" style={{ background: color, color: ink }}>
          <Icon className="size-[18px]" />
        </span>
        <ArrowUpRight className="size-4 text-ink-subtle" />
      </div>
      <p className="mt-4 text-[32px] font-extrabold leading-none tracking-tighter tabular-nums">{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-ink-2">{label}</p>
      {hint && <p className="text-[12px] text-ink-subtle">{hint}</p>}
    </div>
  );
}

/* ─── Next up hero (Luma two-column event page + Unstop countdown) ──────── */

export function NextUpHero({ event }: { event: NextUp }) {
  const badge = eventBadge(event);
  return (
    <section className="card grid overflow-hidden animate-fade-up md:grid-cols-[1.05fr_1fr]">
      {/* Poster */}
      <div className="relative isolate flex min-h-[260px] flex-col justify-between p-6 text-white md:min-h-[420px] md:p-7">
        <EventArt accent={event.accent} />
        <div className="relative flex flex-wrap items-center gap-2">
          <Chip tone="dark">Next up</Chip>
          <Chip tone="white">{CATEGORY_LABEL[event.category]}</Chip>
          {event.visibility === "CODE_ONLY" && <Chip tone="white">Private</Chip>}
        </div>
        <div className="relative">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/80">
            {fmtDate(event.startsAt, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="mt-1 text-[clamp(32px,4.4vw,50px)] font-extrabold leading-[1.02] tracking-tightest">{event.title}</h2>
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
              <Meter value={event.registered} max={event.capacity} className="mt-3 bg-white" />
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
    <section className="card relative isolate flex min-h-[420px] flex-col items-start justify-end overflow-hidden p-9 text-white animate-fade-up">
      <EventArt accent="violet" intensity={0.8} />
      <div className="relative">
        <h2 className="text-[40px] font-extrabold leading-tight tracking-tightest">Nothing on your calendar.</h2>
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
    { label: "Registrations", value: registrations.toLocaleString("en-IN"), hint: `across ${data.hosted.length} events`, icon: Users, color: "#efebff", ink: "#3b22d6" },
    { label: "Fees collected", value: formatINR(collected), hint: "from paid passes", icon: BadgeIndianRupee, color: "#e2f7ee", ink: "#0b7f4f" },
    { label: "Checked in now", value: data.live ? data.live.checkedIn : 0, hint: data.live ? data.live.title : "no live event", icon: ScanLine, color: "#e0f2fe", ink: "#0369a1" },
    { label: "Payments pending", value: pending, hint: "follow up at the desk", icon: Ticket, color: "#fff3df", ink: "#b45309" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {boxes.map((b, i) => (
        <StatTile key={b.label} {...b} delay={i * 50} />
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
                <Meter value={h.registered} max={h.capacity} className="bg-white" />
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
          <QuickAction href={data.live ? `/organizer/scan/${data.live.id}` : "/organizer"} icon={ScanLine} label="Scan passes" hint={data.live ? data.live.title : "pick an event"} color="#e0f2fe" ink="#0369a1" />
          <QuickAction href="/organizer" icon={FileText} label="Attendees & CSV" hint="payments, export" color="#fff3df" ink="#b45309" />
          <QuickAction
            href={data.live ? `/organizer/events/${data.live.id}` : data.hosted[0] ? `/organizer/events/${data.hosted[0].id}` : "/organizer"}
            icon={Megaphone}
            label="Broadcast update"
            hint={data.live?.title ?? data.hosted[0]?.title ?? "pick an event"}
            color="#ede9fe"
            ink="#5b3fff"
          />
          <QuickAction href="/organizer#whatsapp" icon={MessageCircle} label="WhatsApp" hint="reminders queue automatically" color="#dcfce7" ink="#15803d" />
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
  color = "#f4f4f7",
  ink = "#3d3d48",
}: {
  href?: string;
  planned?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  primary?: boolean;
  color?: string;
  ink?: string;
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
        primary ? "border-transparent bg-ink text-white hover:bg-black" : "border-line bg-surface hover:border-ink",
      )}
    >
      <span
        className="grid size-9 place-items-center rounded-xl"
        style={primary ? { background: "rgba(255,255,255,0.14)", color: "#fff" } : { background: color, color: ink }}
      >
        <Icon className="size-[18px]" />
      </span>
      <div>
        <p className="text-[13.5px] font-bold leading-tight">{label}</p>
        {hint && <p className={cn("mt-0.5 text-[11.5px]", primary ? "text-white/70" : "text-ink-muted")}>{hint}</p>}
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
                  <div className="text-[10px] font-bold uppercase tracking-wider">{fmtDate(e.startsAt, { month: "short" })}</div>
                  <div className="text-[20px] font-extrabold leading-none tabular-nums">{fmtDate(e.startsAt, { day: "numeric" })}</div>
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
    <section className="animate-fade-up">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Happening on campus</p>
          <h2 className="headline mt-1 text-[26px]">Don&apos;t miss these</h2>
        </div>
        <LinkButton href="/events" variant="secondary" className="py-2 text-[13px]">
          Browse all <ArrowUpRight className="size-4" />
        </LinkButton>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
        ))}
      </div>
    </section>
  );
}

export function EventCard({ e }: { e: EventSummary }) {
  const badge = eventBadge(e);
  return (
    <article className="card lift group flex w-[280px] shrink-0 snap-start flex-col overflow-hidden lg:w-auto">
      <Link href={`/events/${e.slug}`} className="relative isolate block h-[150px] overflow-hidden">
        <EventArt accent={e.accent} className="transition-transform duration-700 ease-apple group-hover:scale-105" />
        <div className="relative flex gap-1.5 p-3">
          <Chip tone="white">{CATEGORY_LABEL[e.category]}</Chip>
          {badge && <Chip tone={badge.tone}>{badge.label}</Chip>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-brand">
          {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.startsAt)}
        </p>
        <Link href={`/events/${e.slug}`} className="mt-1 text-[17px] font-extrabold leading-snug tracking-tight hover:text-brand">
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
          <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-bold", e.feePaise > 0 ? "bg-ink text-white" : "bg-live-soft text-live")}>
            {e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ─── Vault + navigator teasers ─────────────────────────────────────────── */

export function VaultTeaser({ photosOfYou, preview = [] }: { photosOfYou: number; preview?: string[] }) {
  const tiles = ["violet", "orange", "teal", "pink", "blue", "green"];
  return (
    <Card eyebrow="Photo Vault" title={photosOfYou === 1 ? "1 photo of you" : `${photosOfYou} photos of you`} icon={Camera} action={{ label: "Open", href: "/vault" }} className="h-full">
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t, i) => (
          <div key={t} className={cn("relative isolate overflow-hidden rounded-2xl bg-canvas", i === 0 ? "col-span-2 row-span-2 aspect-auto" : "aspect-square")}>
            {preview[i] ? (
              // Real thumbnails of photos I tagged myself in.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/photos/${preview[i]}?size=thumb`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <EventArt accent={t} intensity={0.8} />
                <Camera className="absolute bottom-2 right-2 size-3.5 text-white/70" />
              </>
            )}
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
      <div className="relative h-[150px] overflow-hidden rounded-2xl bg-[#eef3ea]">
        {/* Stylised campus map placeholder — swap for Mapbox/Leaflet or an SVG campus plan. */}
        <svg viewBox="0 0 400 150" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <g stroke="#ffffff" strokeWidth="10" strokeLinecap="round">
            <path d="M0 110 H400" />
            <path d="M130 0 V150" />
            <path d="M260 0 V150" />
          </g>
          <g fill="#dfe7d8">
            <rect x="20" y="18" width="90" height="70" rx="10" />
            <rect x="150" y="18" width="92" height="70" rx="10" />
            <rect x="282" y="18" width="100" height="70" rx="10" />
          </g>
          <circle cx="200" cy="52" r="18" fill="#cfe5c6" />
          <path d="M60 128 C 120 128, 130 110, 140 100 S 250 105, 330 54" fill="none" stroke="#5b3fff" strokeWidth="3.5" strokeDasharray="7 6" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1s" repeatCount="indefinite" />
          </path>
          <circle cx="60" cy="128" r="7" fill="#121218" stroke="#fff" strokeWidth="3" />
          <circle cx="330" cy="54" r="16" fill="#5b3fff" opacity="0.18" />
          <circle cx="330" cy="54" r="8" fill="#5b3fff" stroke="#fff" strokeWidth="3" />
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
    <div className="flex items-center gap-3 rounded-2xl bg-warn-soft p-3.5 text-[13px] font-semibold animate-fade-up">
      <Sparkles className="size-4 shrink-0 text-warn" />
      <span className="text-ink-2">{formatINR(amountPaise)} due · UPI payments are coming soon. Pay the organizer at the desk for now.</span>
    </div>
  );
}
