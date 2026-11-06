import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarPlus, CircleAlert, MessageCircle, Pencil, ScanLine, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { all, getDB } from "@/lib/db";
import { draftClashes } from "@/lib/data/dashboard";
import { outboxCounts, whatsappConnected } from "@/lib/notify";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { PageHero } from "@/components/brand/PageHero";

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

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <PageHero
        eyebrow="Organizer"
        title={<>Your <em>events</em></>}
        sub="Registrations, payments, updates and the gate, for every event you run."
        marquee={["Run your event", "Live at the gate"]}
        actions={
          <Link href="/organizer/events/new" className="inline-flex items-center gap-1.5 rounded-full bg-volt px-5 py-3 text-[14px] font-bold text-ink-inverse hover:bg-volt-hover">
            <CalendarPlus className="size-4" aria-hidden /> New event
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section id="whatsapp" className="card p-5">
          <p className="flex items-center gap-2 text-[14px] font-bold"><MessageCircle className="size-4 text-ink-subtle" /> WhatsApp</p>
          <p className={`mt-2 text-[15px] font-semibold ${connected ? "text-live" : "text-warn"}`}>
            WhatsApp sending: {connected ? "connected" : "not connected"}
          </p>
          <p className="mt-1 text-[13.5px] text-ink-2">
            <span className="font-mono font-bold tabular-nums">{outbox.queued}</span> message{outbox.queued === 1 ? "" : "s"} queued
            {outbox.sent > 0 && <> · <span className="font-mono tabular-nums">{outbox.sent}</span> sent</>}
            {outbox.failed > 0 && <> · <span className="font-mono tabular-nums text-danger">{outbox.failed}</span> failed</>}
          </p>
          {!connected && (
            <p className="mt-2 text-[12.5px] text-ink-muted">
              Updates, seat holds and day-before reminders are saved here and will go out once a WhatsApp provider is connected. Nothing has been sent yet.
            </p>
          )}
        </section>

        <section className="card p-5 lg:col-span-2">
          <p className="flex items-center gap-2 text-[14px] font-bold"><AlertTriangle className="size-4 text-ink-subtle" /> Schedule check</p>
          {clashes.length === 0 ? (
            <p className="mt-2 text-[14px] text-ink-2">Your drafts don&apos;t overlap a booked venue or a big campus event.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {clashes.map((c, i) => (
                <li key={i} className={`flex gap-2.5 rounded-2xl p-3 text-[13.5px] ${c.severity === "hard" ? "bg-danger-soft" : "bg-warn-soft"}`}>
                  {c.severity === "hard" ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />}
                  <span>
                    <b>{c.forEvent}</b> vs {c.title}: {c.reason}{" "}
                    <span className="text-ink-muted">({fmtDate(c.startsAt, { day: "numeric", month: "short" })} · {fmtRange(c.startsAt, c.endsAt)} · {c.severity === "hard" ? "blocks publishing" : "warning only"})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {upcoming.length === 0 ? (
        <section className="card flex flex-col items-start gap-3 p-8">
          <h2 className="title-serif text-[32px]">No upcoming events</h2>
          <p className="text-[14.5px] text-ink-muted">Create one and it shows up here with live registrations and check-ins.</p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((e) => <EventRow key={e.id} e={e} />)}
        </div>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="title-serif text-[32px]">Past events</h2>
          <div className="grid gap-4 md:grid-cols-2">{past.map((e) => <EventRow key={e.id} e={e} />)}</div>
        </section>
      )}
    </div>
  );
}

function EventRow({ e }: { e: MyEvent }) {
  const live = Date.parse(e.starts_at) <= Date.now() && Date.parse(e.ends_at) > Date.now() && e.status === "published";
  const statusChip =
    e.status === "draft" ? <Chip tone="warn">Draft</Chip> : e.status === "cancelled" ? <Chip tone="danger">Cancelled</Chip> : live ? <Chip tone="live" pulse>Live now</Chip> : e.status === "closed" ? <Chip>Closed</Chip> : <Chip tone="outline">Published</Chip>;

  return (
    <article className="card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/organizer/events/${e.id}`} className="block truncate text-[17px] font-bold hover:underline">{e.title}</Link>
          <p className="text-[13px] text-ink-muted">{fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(new Date(e.starts_at))} · {e.venue}</p>
        </div>
        {statusChip}
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[12.5px] font-semibold">
          <span><span className="font-mono tabular-nums">{e.registered}</span> registered{e.waitlisted > 0 && <> · <span className="font-mono tabular-nums">{e.waitlisted}</span> waiting</>}</span>
          <span className="text-ink-muted">of <span className="font-mono tabular-nums">{e.capacity}</span></span>
        </div>
        <Meter value={e.registered} max={e.capacity} />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-canvas py-2"><dd className="font-mono text-[17px] font-bold tabular-nums">{e.checked_in}</dd><dt className="text-[11px] font-semibold text-ink-subtle">checked in</dt></div>
        <div className="rounded-2xl bg-canvas py-2"><dd className={`font-mono text-[17px] font-bold tabular-nums ${e.unpaid ? "text-warn" : ""}`}>{e.price_paise ? e.unpaid : "—"}</dd><dt className="text-[11px] font-semibold text-ink-subtle">unpaid</dt></div>
        <div className="rounded-2xl bg-canvas py-2"><dd className="text-[14px] font-bold">{formatINR(e.price_paise)}</dd><dt className="text-[11px] font-semibold text-ink-subtle">fee</dt></div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link href={`/organizer/events/${e.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-ink-inverse"><Users className="size-4" /> Attendees & updates</Link>
        {e.status === "published" && <Link href={`/organizer/scan/${e.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-ink"><ScanLine className="size-4" /> Scanner</Link>}
        <Link href={`/organizer/events/${e.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-muted hover:text-ink"><Pencil className="size-4" /> Edit</Link>
      </div>
    </article>
  );
}
