import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarPlus, CircleAlert, MessageCircle, Pencil, ScanLine, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { all, getDB } from "@/lib/db";
import { draftClashes } from "@/lib/data/dashboard";
import { outboxCounts, whatsappConnected } from "@/lib/notify";
import { formatINR } from "@/lib/money";
import { cn, fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { PageHero } from "@/components/brand/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Organizer" };
export const dynamic = "force-dynamic";

interface MyEvent {
  id: string;
  slug: string;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string;
  venue: string;
  capacity: number;
  price_paise: number;
  registered: number;
  waitlisted: number;
  checked_in: number;
  unpaid: number;
}

export default async function OrganizerHome() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/organizer");
  if (!viewer.verifiedOrganizer) redirect("/dashboard");

  const owner = viewer.role === "admin" ? "1 = 1" : "e.organizer_id = ?";
  const ownerArgs = viewer.role === "admin" ? [] : [viewer.id];
  const events = await all<MyEvent>(
    `SELECT e.id, e.slug, e.title, e.status, e.starts_at, e.ends_at, e.venue, e.capacity, e.price_paise,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'waitlisted') AS waitlisted,
            (SELECT COUNT(*) FROM checkins c WHERE c.event_id = e.id) AS checked_in,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered' AND r.payment_status = 'unpaid' AND e.price_paise > 0) AS unpaid
       FROM events e WHERE ${owner}
      ORDER BY e.ends_at < ? , CASE WHEN e.ends_at < ? THEN -julianday(e.starts_at) ELSE julianday(e.starts_at) END`,
    ...ownerArgs,
    new Date().toISOString(),
    new Date().toISOString(),
  );

  const now = Date.now();
  const upcoming = events.filter((e) => Date.parse(e.ends_at) > now);
  const past = events.filter((e) => Date.parse(e.ends_at) <= now);
  const [clashes, outbox] = await Promise.all([draftClashes(viewer), outboxCounts(await getDB(), events.map((e) => e.id))]);
  const connected = whatsappConnected();

  const totals = {
    registered: upcoming.reduce((a, e) => a + e.registered, 0),
    checkedIn: events.reduce((a, e) => a + e.checked_in, 0),
    unpaid: upcoming.reduce((a, e) => a + e.unpaid, 0),
  };

  return (
    <div className="space-y-12 pb-8">
      <PageHero
        eyebrow="Organizer"
        title={
          <>
            Your <em>events.</em>
          </>
        }
        sub="Registrations, payments, updates and the gate, for every event you run."
        actions={
          <LinkButton href="/organizer/events/new">
            <CalendarPlus className="size-4" aria-hidden /> New event
          </LinkButton>
        }
      />

      {/* Totals strip */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line shadow-card md:grid-cols-4">
        {[
          { l: "Upcoming events", v: upcoming.length },
          { l: "Registered (upcoming)", v: totals.registered },
          { l: "Checked in (all time)", v: totals.checkedIn },
          { l: "Unpaid at the desk", v: totals.unpaid, warn: totals.unpaid > 0 },
        ].map((t) => (
          <div key={t.l} className="bg-surface p-5">
            <dt className="text-[12.5px] text-ink-muted">{t.l}</dt>
            <dd className={cn("mt-3 font-mono text-[30px] font-medium leading-none tracking-[-0.05em] tabular-nums", t.warn && "text-warn")}>{t.v.toLocaleString("en-IN")}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <section id="whatsapp" aria-labelledby="wa-heading" className="card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="wa-heading" className="flex items-center gap-2 text-h4 font-semibold">
              <MessageCircle className="size-4 text-ink-subtle" aria-hidden /> WhatsApp
            </h2>
            <Chip tone={connected ? "live" : "warn"}>{connected ? "Connected" : "Not connected"}</Chip>
          </div>
          <p className="mt-4 text-[14px] text-ink-2">
            <span className="font-mono font-medium tabular-nums text-ink">{outbox.queued}</span> message{outbox.queued === 1 ? "" : "s"} queued
            {outbox.sent > 0 && (
              <>
                {" "}
                · <span className="font-mono tabular-nums">{outbox.sent}</span> sent
              </>
            )}
            {outbox.failed > 0 && (
              <>
                {" "}
                · <span className="font-mono tabular-nums text-danger">{outbox.failed}</span> failed
              </>
            )}
          </p>
          {!connected && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
              Updates, seat holds and day-before reminders are saved here and will go out once a WhatsApp provider is connected. Nothing has been sent yet.
            </p>
          )}
        </section>

        <section aria-labelledby="clash-heading" className="card p-5 md:p-6 lg:col-span-2">
          <h2 id="clash-heading" className="flex items-center gap-2 text-h4 font-semibold">
            <AlertTriangle className="size-4 text-ink-subtle" aria-hidden /> Schedule check
          </h2>
          {clashes.length === 0 ? (
            <p className="mt-4 text-[14px] text-ink-2">Your drafts don&apos;t overlap a booked venue or a big campus event.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {clashes.map((c, i) => (
                <li key={i} className={cn("flex gap-2.5 rounded-tile p-3.5 text-[13.5px]", c.severity === "hard" ? "bg-danger-soft" : "bg-warn-soft")}>
                  {c.severity === "hard" ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />}
                  <span>
                    <span className="font-medium">{c.forEvent}</span> vs {c.title}: {c.reason}{" "}
                    <span className="text-ink-muted">
                      ({fmtDate(c.startsAt, { day: "numeric", month: "short" })} · {fmtRange(c.startsAt, c.endsAt)} · {c.severity === "hard" ? "blocks publishing" : "warning only"})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="upcoming-heading" className="space-y-5">
        <h2 id="upcoming-heading" className="text-display-md font-semibold">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarPlus} title="No upcoming events" body="Create one and it shows up here with live registrations and check-ins." action={{ label: "New event", href: "/organizer/events/new" }} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="space-y-5">
          <h2 id="past-heading" className="text-display-md font-semibold">
            Past events
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EventRow({ e }: { e: MyEvent }) {
  const live = Date.parse(e.starts_at) <= Date.now() && Date.parse(e.ends_at) > Date.now() && e.status === "published";
  const statusChip =
    e.status === "draft" ? (
      <Chip tone="warn">Draft</Chip>
    ) : e.status === "cancelled" ? (
      <Chip tone="danger">Cancelled</Chip>
    ) : live ? (
      <Chip tone="accent" pulse>
        Live now
      </Chip>
    ) : e.status === "closed" ? (
      <Chip>Closed</Chip>
    ) : (
      <Chip tone="outline">Published</Chip>
    );

  return (
    <article className="card flex flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/organizer/events/${e.id}`} className="block truncate text-h4 font-semibold hover:underline hover:decoration-line-strong hover:underline-offset-4">
            {e.title}
          </Link>
          <p className="mt-1 text-[13px] text-ink-muted">
            <span className="font-mono text-[12px] uppercase tracking-[0.03em]">
              {fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(new Date(e.starts_at))}
            </span>{" "}
            · {e.venue}
          </p>
        </div>
        {statusChip}
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-[12.5px]">
          <span>
            <span className="font-mono font-medium tabular-nums">{e.registered}</span> registered
            {e.waitlisted > 0 && (
              <>
                {" "}
                · <span className="font-mono tabular-nums">{e.waitlisted}</span> waiting
              </>
            )}
          </span>
          <span className="text-ink-muted">
            of <span className="font-mono tabular-nums">{e.capacity}</span>
          </span>
        </div>
        <Meter value={e.registered} max={e.capacity} />
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-line rounded-tile bg-sunken/70 py-3 text-center">
        <div>
          <dt className="text-[11.5px] text-ink-muted">Checked in</dt>
          <dd className="mt-0.5 font-mono text-[17px] font-medium tabular-nums">{e.checked_in}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-muted">Unpaid</dt>
          <dd className={cn("mt-0.5 font-mono text-[17px] font-medium tabular-nums", e.unpaid && "text-warn")}>{e.price_paise ? e.unpaid : "—"}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-muted">Fee</dt>
          <dd className="mt-0.5 font-mono text-[15px] font-medium tabular-nums">{e.price_paise ? formatINR(e.price_paise) : "Free"}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <LinkButton href={`/organizer/events/${e.id}`} size="sm">
          <Users className="size-3.5" aria-hidden /> Attendees & updates
        </LinkButton>
        {e.status === "published" && (
          <LinkButton href={`/organizer/scan/${e.id}`} variant="secondary" size="sm">
            <ScanLine className="size-3.5" aria-hidden /> Scanner
          </LinkButton>
        )}
        <LinkButton href={`/organizer/events/${e.id}/edit`} variant="ghost" size="sm" className="ml-auto">
          <Pencil className="size-3.5" aria-hidden /> Edit
        </LinkButton>
      </div>
    </article>
  );
}
