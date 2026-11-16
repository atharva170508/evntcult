import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Camera, Download, MessageCircle, Pencil, ScanLine, Search } from "lucide-react";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { all, count, first, getDB } from "@/lib/db";
import { listAttendees } from "@/lib/data/organizer-actions";
import { outboxCounts, whatsappConnected } from "@/lib/notify";
import { formatINR } from "@/lib/money";
import { cn, fmtDate, fmtRange, fmtTime, relative } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { UpdateComposer } from "@/components/organizer/UpdateComposer";
import { PaymentCell } from "@/components/organizer/PaymentCell";
import { PageHero } from "@/components/brand/PageHero";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";
import { Notice } from "@/components/ui/Field";

export const metadata: Metadata = { title: "Manage event" };
export const dynamic = "force-dynamic";

const UPDATE_LABEL: Record<string, string> = { schedule: "Schedule change", venue: "Venue change", update: "Update" };
const PAGE = 100;

export default async function ManageEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; all?: string }> }) {
  const [{ id }, { q, all: showAll }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=/organizer/events/${encodeURIComponent(id)}`);
  if (!viewer.verifiedOrganizer) redirect("/dashboard");
  if (!(await canManageEvent(viewer, id))) notFound();

  const e = await first<{ id: string; slug: string; title: string; status: string; venue: string; starts_at: string; ends_at: string; capacity: number; price_paise: number; access: string; access_code: string | null }>(
    "SELECT id, slug, title, status, venue, starts_at, ends_at, capacity, price_paise, access, access_code FROM events WHERE id = ?",
    id,
  );
  if (!e) notFound();

  const db = await getDB();
  const [stats, attendees, updates, outbox, optedIn] = await Promise.all([
    first<{ registered: number; waitlisted: number; checked_in: number; paid: number; unpaid: number }>(
      `SELECT SUM(r.status = 'registered') AS registered, SUM(r.status = 'waitlisted') AS waitlisted,
              (SELECT COUNT(*) FROM checkins c WHERE c.event_id = ?1) AS checked_in,
              SUM(r.status = 'registered' AND r.payment_status = 'paid') AS paid,
              SUM(r.status = 'registered' AND r.payment_status = 'unpaid') AS unpaid
         FROM registrations r WHERE r.event_id = ?1`,
      id,
    ),
    listAttendees(db, id, q),
    all<{ id: string; kind: string; body: string; created_at: string; notified: number }>("SELECT id, kind, body, created_at, notified FROM event_updates WHERE event_id = ? ORDER BY created_at DESC LIMIT 10", id),
    outboxCounts(db, [id]),
    count(
      `SELECT COUNT(*) AS n FROM registrations r JOIN users u ON u.id = r.user_id
        WHERE r.event_id = ? AND r.status = 'registered' AND u.whatsapp_opt_in = 1 AND u.phone IS NOT NULL`,
      id,
    ),
  ]);
  const s = { registered: stats?.registered ?? 0, waitlisted: stats?.waitlisted ?? 0, checkedIn: stats?.checked_in ?? 0, paid: stats?.paid ?? 0, unpaid: stats?.unpaid ?? 0 };
  const paidEvent = e.price_paise > 0;
  const connected = whatsappConnected();
  const shown = showAll ? attendees : attendees.slice(0, PAGE);

  const statusTone = e.status === "published" ? "live" : e.status === "draft" ? "warn" : e.status === "cancelled" ? "danger" : "neutral";
  const th = "px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em]";

  return (
    <div className="space-y-10 pb-8 pt-6 md:pt-8">
      <Link href="/organizer" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-4 transition-transform duration-base ease-out group-hover:-translate-x-0.5" aria-hidden /> Your events
      </Link>

      <PageHero
        className="pt-0 md:pt-0"
        eyebrow={
          <span className="inline-flex items-center gap-2">
            Manage event <Chip tone={statusTone} className="normal-case tracking-normal">{e.status[0].toUpperCase() + e.status.slice(1)}</Chip>
          </span>
        }
        title={e.title}
        sub={
          <>
            {fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })} · {fmtRange(new Date(e.starts_at), new Date(e.ends_at))} · {e.venue}
            {e.access === "code" && e.access_code && (
              <>
                {" "}
                · code <span className="font-mono font-medium tracking-[0.12em] text-ink">{e.access_code}</span>
              </>
            )}
          </>
        }
        actions={
          <>
            {e.status === "published" && (
              <LinkButton href={`/organizer/scan/${e.id}`}>
                <ScanLine className="size-4" aria-hidden /> Gate scanner
              </LinkButton>
            )}
            {e.status !== "draft" && (
              <LinkButton href={`/events/${e.slug}/photos`} variant="secondary">
                <Camera className="size-4" aria-hidden /> Photos
              </LinkButton>
            )}
            <LinkButton href={`/organizer/events/${e.id}/edit`} variant="secondary">
              <Pencil className="size-4" aria-hidden /> Edit
            </LinkButton>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line shadow-card lg:grid-cols-4">
        {(
          [
            ["Registered", <>{s.registered}<span className="text-ink-subtle"> / {e.capacity}</span></>, <Meter key="m" value={s.registered} max={e.capacity} className="mt-3" />],
            ["Waitlist", String(s.waitlisted), null],
            ["Checked in", String(s.checkedIn), <Meter key="c" value={s.checkedIn} max={Math.max(1, s.registered)} className="mt-3" />],
            paidEvent
              ? ["Fees collected", formatINR(s.paid * e.price_paise), <p key="u" className={cn("mt-2 text-[12.5px]", s.unpaid ? "font-medium text-warn" : "text-ink-muted")}>{s.unpaid} unpaid</p>]
              : ["Entry", "Free", null],
          ] as const
        ).map(([label, value, extra], i) => (
          <div key={i} className="bg-surface p-5">
            <dt className="text-[12.5px] text-ink-muted">{label}</dt>
            <dd className="mt-3 font-mono text-[26px] font-medium leading-none tracking-[-0.04em] tabular-nums">{value}</dd>
            {extra}
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="update-heading" className="card p-5 md:p-6">
          <h2 id="update-heading" className="text-h3 font-semibold">
            Post an update
          </h2>
          <p className="mb-5 mt-1 text-[13px] text-ink-muted">Shows on registered students&apos; dashboards straight away.</p>
          {e.status === "draft" ? <Notice>Publish the event first, then you can post updates.</Notice> : <UpdateComposer eventId={e.id} optedIn={optedIn} connected={connected} />}
        </section>

        <section aria-labelledby="wa-heading" className="card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="wa-heading" className="flex items-center gap-2 text-h4 font-semibold">
              <MessageCircle className="size-4 text-ink-subtle" aria-hidden /> WhatsApp
            </h2>
            <Chip tone={connected ? "live" : "warn"}>{connected ? "Connected" : "Not connected"}</Chip>
          </div>
          <p className="mt-3 text-[13.5px] text-ink-2">
            <span className="font-mono font-medium tabular-nums text-ink">{outbox.queued}</span> queued · <span className="font-mono tabular-nums">{outbox.sent}</span> sent ·{" "}
            <span className="font-mono tabular-nums">{optedIn}</span> registered students opted in
          </p>
          <h3 className="eyebrow mt-6 border-t border-line pt-5">Recent updates</h3>
          {updates.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-ink-muted">None yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {updates.map((u) => (
                <li key={u.id} className="text-[13.5px]">
                  <p>
                    <span className="font-medium">{UPDATE_LABEL[u.kind] ?? "Update"}</span>{" "}
                    <span className="text-ink-muted">
                      · {relative(new Date(u.created_at))}
                      {u.notified ? " · WhatsApp" : ""}
                    </span>
                  </p>
                  <p className="mt-0.5 text-ink-2">{u.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="attendees-heading" className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 md:px-5">
          <h2 id="attendees-heading" className="text-h3 font-semibold">
            Attendees{" "}
            <span className="font-mono text-[14px] font-normal tabular-nums text-ink-muted">
              {attendees.length}
              {q ? " found" : ""}
            </span>
          </h2>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <form role="search" className="flex h-9 flex-1 items-center gap-2 rounded-full bg-sunken/70 pl-3.5 pr-1 focus-within:bg-surface focus-within:shadow-card sm:flex-none">
              <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              <input name="q" type="search" defaultValue={q} placeholder="Name, email or pass code" aria-label="Search attendees" className="w-full min-w-0 bg-transparent text-[13.5px] focus:outline-none sm:w-52" />
              <button className={buttonClass("primary", "sm", "h-7")}>Search</button>
            </form>
            <a href={`/api/events/${e.id}/attendees?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={buttonClass("secondary", "sm", "h-9")}>
              <Download className="size-3.5" aria-hidden /> CSV
            </a>
          </div>
        </div>

        {attendees.length === 0 ? (
          <div className="p-6">
            <Notice>{q ? `Nobody matches “${q}”.` : "No registrations yet."}</Notice>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead className="border-b border-line bg-sunken/40 text-ink-subtle">
                <tr>
                  <th scope="col" className={th}>Name</th>
                  <th scope="col" className={th}>Pass</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={th}>Checked in</th>
                  {paidEvent && <th scope="col" className={th}>Payment</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((a) => (
                  <tr key={a.id} className="transition-colors duration-fast hover:bg-sunken/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.name}</p>
                      <p className="text-[12px] text-ink-muted">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] tracking-[0.06em]">{a.pass_code}</td>
                    <td className="px-4 py-3">{a.status === "registered" ? <Chip tone="outline">Registered</Chip> : a.hold_expires_at ? <Chip tone="warn">Seat held</Chip> : <Chip>Waitlist</Chip>}</td>
                    <td className="px-4 py-3">{a.checked_in_at ? <span className="font-mono font-medium text-live">{fmtTime(new Date(a.checked_in_at))}</span> : <span className="text-ink-subtle">—</span>}</td>
                    {paidEvent && (
                      <td className="px-4 py-3">
                        {a.status === "registered" ? <PaymentCell regId={a.id} paid={a.payment_status === "paid"} method={a.payment_method} refCode={a.payment_ref} /> : <span className="text-ink-subtle">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {attendees.length > shown.length && (
          <p className="border-t border-line p-4 text-[13px] text-ink-muted">
            Showing <span className="font-mono">{shown.length}</span> of <span className="font-mono">{attendees.length}</span>.{" "}
            <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), all: "1" })}`} className="link">
              Show all
            </Link>{" "}
            or download the CSV.
          </p>
        )}
      </section>
    </div>
  );
}
