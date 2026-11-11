import Link from "next/link";
import type { AnnouncementItem, EventSummary, NextUp, OrganizerPanel } from "@/lib/data/types";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { LinkButton } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Ticket } from "@/components/ui/Ticket";
import { Countdown } from "./Countdown";
import { LiveHeadcount } from "./LiveHeadcount";
import { formatAmount, formatINR } from "@/lib/money";
import { EmptyState } from "@/components/ui/EmptyState";
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

/** Status words: Sold out / Almost full / Today / Tomorrow. Always words, never colour alone. */
function eventBadge(e: EventSummary): { label: string; tone: ChipTone } | null {
  if (e.capacity !== null && e.registered >= e.capacity) return { label: "Sold out", tone: "danger" };
  if (e.capacity !== null && e.registered / e.capacity >= 0.85) return { label: "Almost full", tone: "warn" };
  const hours = (+e.startsAt - Date.now()) / 3_600_000;
  if (hours > 0 && hours < 24) return { label: "Today", tone: "neutral" };
  if (hours >= 24 && hours < 48) return { label: "Tomorrow", tone: "neutral" };
  return null;
}

/** A section head with editorial numbering (§3): 01, 02, 03 in mono. */
export function SectionHead({ n, title, action }: { n: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-caption text-ink-subtle">{n}</span>
        <h2 className="text-heading">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ─── Filter links ───────────────────────────────────────────────────────── */

const FILTERS = [
  { href: "/events?when=today", label: "Today" },
  { href: "/events?when=weekend", label: "This weekend" },
  { href: "/events?price=free", label: "Free" },
  { href: "/events?type=GAMING", label: "Gaming" },
  { href: "/events?type=SPORTS", label: "Sports" },
  { href: "/events?type=TECH", label: "Tech" },
  { href: "/events?type=CULTURAL", label: "Cultural" },
  { href: "/events?type=PARTY", label: "Parties" },
  { href: "/events?type=WORKSHOP", label: "Workshops" },
  { href: "/events?type=TALK", label: "Talks" },
];

export function QuickTiles() {
  return (
    <nav aria-label="Browse by" className="no-scrollbar flex gap-2 overflow-x-auto">
      {FILTERS.map((t) => (
        <Link key={t.label} href={t.href} className="press inline-flex h-8 shrink-0 items-center rounded-sm border border-line px-3 text-label text-ink-muted hover:border-line-strong hover:text-ink">
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/* ─── Numbers: one hairline row, mono figures ───────────────────────────── */

export function StatRow({ items }: { items: { label: string; value: string | number; hint?: string; href?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
      {items.map((s) => {
        const body = (
          <>
            <dt className="text-label text-ink-muted">{s.label}</dt>
            <dd className="mt-1 font-mono text-heading font-medium tabular-nums text-ink">{s.value}</dd>
            {s.hint && <dd className="truncate text-label text-ink-subtle">{s.hint}</dd>}
          </>
        );
        return (
          <div key={s.label} className="min-w-0 border-b border-line py-4 pr-4 [&:nth-child(odd)]:border-r lg:border-r lg:pl-4 lg:first:pl-0 lg:last:border-r-0 [&:nth-child(even)]:pl-4">
            {s.href ? (
              <Link href={s.href} className="block hover:[&_dt]:text-ink">
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
    </dl>
  );
}

/* ─── Next up: the pass itself ──────────────────────────────────────────── */

const payLabel = { PAID: "Paid", PENDING: "Payment pending", FAILED: "Payment failed", REFUNDED: "Refunded", WAIVED: "Fee waived", NOT_REQUIRED: "Free entry" } as const;
const payTone = { PAID: "live", PENDING: "warn", FAILED: "danger", REFUNDED: "neutral", WAIVED: "neutral", NOT_REQUIRED: "neutral" } as const;

export function NextUpHero({ event, saveButton }: { event: NextUp; saveButton?: React.ReactNode }) {
  const badge = eventBadge(event);
  return (
    <div className="grid gap-8 lg:grid-cols-[520px_minmax(0,1fr)]">
      <Ticket
        category={CATEGORY_LABEL[event.category]}
        title={event.title}
        dateLabel={fmtDate(event.startsAt, { weekday: "short", day: "numeric", month: "short" })}
        time={fmtTime(event.startsAt)}
        venue={event.venueName}
        tagline={event.tagline ?? null}
        qrValue={event.passToken}
        passCode={event.passSerial}
        priceLabel={event.feePaise > 0 ? formatINR(event.feePaise) : "Free"}
        seatsLabel={event.capacity ? `${event.registered} / ${event.capacity}` : `${event.registered} going`}
      />
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Chip tone={payTone[event.paymentStatus]}>{payLabel[event.paymentStatus]}</Chip>
          {event.visibility === "CODE_ONLY" && <Chip>Private</Chip>}
          {badge && <Chip tone={badge.tone}>{badge.label}</Chip>}
        </div>
        <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-y-2 text-body">
          <dt className="text-label leading-[21px] text-ink-muted">When</dt>
          <dd className="font-mono text-body-sm">
            {fmtDate(event.startsAt, { weekday: "long", day: "numeric", month: "short" })} · {fmtRange(event.startsAt, event.endsAt)}
          </dd>
          <dt className="text-label leading-[21px] text-ink-muted">Starts in</dt>
          <dd>
            <Countdown to={event.startsAt} endsAt={event.endsAt} />
          </dd>
          {event.capacity && (
            <>
              <dt className="text-label leading-[21px] text-ink-muted">Seats</dt>
              <dd>
                <Meter value={event.registered} max={event.capacity} className="mt-2 max-w-60" />
                <p className="mt-1 font-mono text-label text-ink-muted">{Math.max(0, event.capacity - event.registered)} left</p>
              </dd>
            </>
          )}
        </dl>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/events/${event.slug}`}>View event</LinkButton>
          <a href={`/api/registrations/${event.registrationId}/ics`} className="press inline-flex h-10 items-center rounded-md border border-line-strong px-4 text-body font-semibold hover:bg-white/[0.04]">
            Add to calendar
          </a>
          {saveButton}
          <LinkButton href={`/venues?to=${event.slug}`} variant="ghost">
            Directions
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

export function EmptyNextUp() {
  return <EmptyState title="Nothing on your calendar." body="Register for an event and its pass shows up here." action={{ label: "Discover events", href: "/events" }} />;
}

/* ─── Organizer ─────────────────────────────────────────────────────────── */

export function OrgKpis({ data }: { data: OrganizerPanel }) {
  const registrations = data.hosted.reduce((a, h) => a + h.registered, 0);
  const collected = data.hosted.reduce((a, h) => a + h.paid * h.feePaise, 0);
  const pending = data.hosted.reduce((a, h) => a + h.pendingPayments, 0);
  return (
    <StatRow
      items={[
        { label: "Registrations", value: registrations.toLocaleString("en-IN"), hint: `across ${data.hosted.length} events` },
        { label: "Fees confirmed", value: formatAmount(collected), hint: "from paid passes" },
        { label: "Checked in now", value: data.live ? data.live.checkedIn : 0, hint: data.live ? data.live.title : "no live event" },
        { label: "Payments to confirm", value: pending, hint: "UPI claims waiting" },
      ]}
    />
  );
}

export function OrganizerConsole({ data }: { data: OrganizerPanel }) {
  const clashes = [...data.clashes.filter((c) => c.severity === "hard"), ...data.clashes.filter((c) => c.severity === "soft")];
  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
      <section className="lg:col-span-5" aria-labelledby="live-h">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="live-h" className="text-title">
            {data.live ? "Live at the gate" : "No event running"}
          </h3>
          {data.live && (
            <Link href={`/organizer/scan/${data.live.id}`} className="text-label text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Open scanner ›
            </Link>
          )}
        </div>
        <div className="mt-4">
          {data.live ? (
            <LiveHeadcount eventId={data.live.id} title={data.live.title} capacity={data.live.capacity} registered={data.live.registered} initial={data.live.checkedIn} />
          ) : (
            <p className="text-body text-ink-muted">When one of your events starts, its headcount shows here.</p>
          )}
        </div>
      </section>

      <section className="min-w-0 lg:col-span-7" aria-labelledby="hosted-h">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="hosted-h" className="text-title">
            Registrations and fees
          </h3>
          <Link href="/organizer" className="text-label text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            Manage ›
          </Link>
        </div>
        <div className="mt-4">
          <Table
            caption="Your events"
            rows={data.hosted}
            rowKey={(h) => h.id}
            empty={{ sentence: "You haven't hosted an event yet.", action: <LinkButton href="/organizer/events/new" size="sm" variant="secondary">Create event</LinkButton> }}
            columns={[
              {
                key: "t",
                header: "Event",
                cell: (h) => (
                  <Link href={`/organizer/events/${h.id}/manage`} className="block max-w-[220px] truncate font-semibold hover:underline">
                    {h.title}
                  </Link>
                ),
              },
              { key: "d", header: "When", cell: (h) => <span className="font-mono text-label text-ink-muted">{fmtDate(h.startsAt, { day: "numeric", month: "short" })} {fmtTime(h.startsAt)}</span> },
              { key: "r", header: "Seats", numeric: true, cell: (h) => `${h.registered} / ${h.capacity ?? "∞"}` },
              {
                key: "f",
                header: "Fees",
                numeric: true,
                cell: (h) => (h.feePaise > 0 ? <span>{formatAmount(h.paid * h.feePaise)}{h.pendingPayments > 0 && <span className="ml-2 text-warn">{h.pendingPayments} to confirm</span>}</span> : <span className="text-ink-muted">Free</span>),
              },
            ]}
          />
        </div>
      </section>

      <section className="lg:col-span-7" aria-labelledby="clash-h">
        <h3 id="clash-h" className="text-title">
          {clashes.length ? `${clashes.length} clash${clashes.length > 1 ? "es" : ""} in your drafts` : "No clashes"}
        </h3>
        {clashes.length === 0 ? (
          <p className="mt-2 text-body text-ink-muted">None of your drafts overlap another event at the same venue.</p>
        ) : (
          <ul className="mt-4 border-t border-line">
            {clashes.map((c, i) => (
              <li key={i} className="border-b border-line py-3">
                <p className="text-body">
                  <span className="font-semibold">{c.forEvent}</span> <span className="text-ink-muted">and</span> <span className="font-semibold">{c.title}</span>
                  <span className={cn("ml-2 font-mono text-label", c.severity === "hard" ? "text-bad" : "text-warn")}>{c.severity === "hard" ? "! blocks publishing" : "! warning"}</span>
                </p>
                <p className="mt-1 text-body-sm text-ink-muted">{c.reason}</p>
                <p className="mt-1 font-mono text-label text-ink-subtle">
                  {fmtDate(c.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtRange(c.startsAt, c.endsAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="lg:col-span-5" aria-labelledby="actions-h">
        <h3 id="actions-h" className="text-title">
          Run your event
        </h3>
        <ul className="mt-4 border-t border-line">
          {[
            { href: "/organizer/events/new", label: "New event" },
            { href: data.live ? `/organizer/scan/${data.live.id}` : "/organizer", label: "Scan passes", hint: data.live?.title ?? "pick an event" },
            { href: "/organizer/guests", label: "Guests and CSV" },
            {
              href: data.live ? `/organizer/events/${data.live.id}/manage` : data.hosted[0] ? `/organizer/events/${data.hosted[0].id}/manage` : "/organizer",
              label: "Post an update",
              hint: data.live?.title ?? data.hosted[0]?.title,
            },
            { href: "/organizer#whatsapp", label: "WhatsApp reminders" },
            { href: "/organizer/calendar", label: "Calendar" },
          ].map((a) => (
            <li key={a.label} className="border-b border-line">
              <Link href={a.href} className="flex h-11 items-center justify-between gap-3 text-body hover:bg-white/[0.03]">
                <span>{a.label}</span>
                <span className="flex min-w-0 items-center gap-2 text-label text-ink-subtle">
                  {a.hint && <span className="truncate">{a.hint}</span>}
                  <span aria-hidden>›</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ─── Updates from organizers ───────────────────────────────────────────── */

const kindLabel: Record<string, string> = { INFO: "Update", SCHEDULE_CHANGE: "Schedule", VENUE_CHANGE: "Venue", URGENT: "Urgent" };

export function Announcements({ items }: { items: AnnouncementItem[] }) {
  return (
    <section aria-labelledby="ann-h">
      <h3 id="ann-h" className="text-title">
        From your organizers
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-body text-ink-muted">No updates yet.</p>
      ) : (
        <ol className="mt-4 border-t border-line">
          {items.map((a) => (
            <li key={a.id} className="border-b border-line py-3">
              <p className="flex flex-wrap items-center gap-2 font-mono text-label text-ink-subtle">
                <Chip>{kindLabel[a.kind]}</Chip>
                {a.eventTitle} · {relative(a.createdAt)}
              </p>
              <p className="mt-2 text-body font-semibold">{a.title}</p>
              <p className="mt-1 max-w-prose text-body-sm text-ink-muted">{a.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ─── Link rows (Venues, Certificates, Vault) ───────────────────────────── */

export function LinkCard({ href, eyebrow, title, body }: { href: string; eyebrow: string; title: string; icon?: unknown; body: string }) {
  return (
    <Link href={href} className="card lift group flex h-full flex-col p-4 sm:p-6">
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-1 text-title">{title}</p>
      <p className="mt-2 text-body-sm text-ink-muted">{body}</p>
      <span className="mt-auto pt-4 text-label text-ink-muted group-hover:text-ink">Open ›</span>
    </Link>
  );
}

/* ─── Coming up (mine) ──────────────────────────────────────────────────── */

export function UpcomingList({ events }: { events: EventSummary[] }) {
  return (
    <section aria-labelledby="up-h">
      <div className="flex items-baseline justify-between">
        <h3 id="up-h" className="text-title">
          Coming up
        </h3>
        <Link href="/calendar" className="text-label text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Calendar ›
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="mt-2 text-body text-ink-muted">Nothing booked. Events you register for appear here.</p>
      ) : (
        <ul className="mt-4 border-t border-line">
          {events.map((e) => (
            <li key={e.id} className="border-b border-line">
              <Link href={`/events/${e.slug}`} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-white/[0.03]">
                <span className="font-mono text-label text-ink-muted">{fmtDate(e.startsAt, { day: "numeric", month: "short" })}</span>
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold">{e.title}</span>
                  <span className="block truncate font-mono text-label text-ink-subtle">
                    {fmtTime(e.startsAt)}
                    {e.venueName ? ` · ${e.venueName}` : ""}
                  </span>
                </span>
                <span aria-hidden className="text-ink-subtle">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─── Campus events ─────────────────────────────────────────────────────── */

export function CampusRail({ events, n = "04" }: { events: EventSummary[]; n?: string }) {
  return (
    <section>
      <SectionHead
        n={n}
        title="Happening soon"
        action={
          <Link href="/events" className="text-label text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            Browse all ›
          </Link>
        }
      />
      {events.length === 0 ? (
        <EmptyState title="No upcoming events." body="When anyone publishes an event, it appears here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * An event as a ticket face (§3): perforation, notches, mono data. Flat — no art, no accent
 * (the accent is saved for the one thing that matters on the screen).
 */
export function EventCard({ e }: { e: EventSummary }) {
  const badge = eventBadge(e);
  return (
    <article className="group relative flex min-w-0 flex-col rounded-md border border-line bg-ticket transition-colors duration-micro hover:border-line-strong">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-ink-muted">{CATEGORY_LABEL[e.category]}</span>
          {badge && <Chip tone={badge.tone}>{badge.label}</Chip>}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-title uppercase">
          <Link href={`/events/${e.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {e.title}
          </Link>
        </h3>
        <p className="mt-2 font-mono text-caption">
          {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.startsAt)}
        </p>
        {e.venueName && <p className="mt-1 truncate font-mono text-caption text-ink-muted">{e.venueName}</p>}
      </div>
      <div className="ticket-cut !my-0" aria-hidden />
      <div className="flex items-center justify-between gap-2 px-4 pb-4 font-mono text-caption">
        <span className="text-ink-muted">{e.capacity ? `${e.registered} / ${e.capacity}` : `${e.registered} going`}</span>
        <span className="text-label text-ink">{e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}</span>
      </div>
    </article>
  );
}

/* ─── Vault ─────────────────────────────────────────────────────────────── */

/** Only real thumbnails. With none, a sentence and the way to get some. */
export function VaultTeaser({ photosOfYou, preview = [] }: { photosOfYou: number; preview?: string[] }) {
  return (
    <Link href="/vault" className="card lift group flex h-full flex-col p-4 sm:p-6">
      <p className="eyebrow">Photo Vault</p>
      <p className="mt-1 text-title">{photosOfYou === 1 ? "1 photo of you" : `${photosOfYou} photos of you`}</p>
      {preview.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {preview.slice(0, 3).map((id) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={id} src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className="aspect-square w-full rounded-sm object-cover" />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-body-sm text-ink-muted">Tap &ldquo;That&apos;s me&rdquo; on event photos to collect yours here.</p>
      )}
      <span className="mt-auto pt-4 text-label text-ink-muted group-hover:text-ink">Open ›</span>
    </Link>
  );
}

export function UpiPending({ amountPaise }: { amountPaise: number }) {
  return (
    <p className="border-l-2 border-warn bg-surface px-4 py-3 text-body-sm">
      <span className="font-semibold text-warn">Payment pending</span> <span className="font-mono">{formatINR(amountPaise)}</span> due. Pay on the event page.
    </p>
  );
}
