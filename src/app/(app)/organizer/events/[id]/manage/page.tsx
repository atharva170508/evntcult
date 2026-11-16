import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Camera, Download, MessageCircle, Pencil, ScanLine, Search } from "lucide-react";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { all, count, first, getDB } from "@/lib/db";
import { listAttendees } from "@/lib/data/organizer-actions";
import { istLabel, whatsappConnected } from "@/lib/notify";
import { MAX_PER_EVENT, waPanel } from "@/lib/whatsapp";
import { WaTestButton } from "@/components/organizer/WaTestButton";
import { eventCertificates } from "@/lib/data/certificates";
import { eventAnswers, listQuestions } from "@/lib/data/questions";
import { listMerch, merchCollected } from "@/lib/data/merch";
import { AttendeeCert, CertPanel } from "@/components/organizer/CertControls";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime, relative } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { UpdateComposer } from "@/components/organizer/UpdateComposer";
import { PaymentCell } from "@/components/organizer/PaymentCell";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Manage event" };
export const dynamic = "force-dynamic";

const WA_LABEL: Record<string, string> = { event_reminder: "reminder", event_soon: "gate opens", payment_pending: "payment nudge", event_updated: "update", event_cancelled: "cancelled" };
const UPDATE_LABEL: Record<string, string> = { schedule: "Schedule change", venue: "Venue change", update: "Update" };
const PAGE = 100;

export default async function ManageEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; all?: string }> }) {
  const [{ id }, { q, all: showAll }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=/organizer/events/${encodeURIComponent(id)}/manage`);
  if (!viewer.verifiedOrganizer) redirect("/dashboard");
  if (!(await canManageEvent(viewer, id))) notFound();

  const e = await first<{ id: string; slug: string; title: string; status: string; venue: string; starts_at: string; ends_at: string; capacity: number; price_paise: number; access: string; access_code: string | null; certificates_enabled: number }>(
    "SELECT id, slug, title, status, COALESCE(venue, 'Venue TBA') AS venue, starts_at, ends_at, capacity, price_paise, access, access_code, certificates_enabled FROM events WHERE id = ?",
    id,
  );
  if (!e) notFound();

  const db = await getDB();
  const [stats, attendees, updates, outbox, optedIn, certs, merch, collected, questions, answers] = await Promise.all([
    first<{ registered: number; waitlisted: number; checked_in: number; paid: number; unpaid: number; to_verify: number }>(
      `SELECT SUM(r.status = 'registered') AS registered, SUM(r.status = 'waitlisted') AS waitlisted,
              (SELECT COUNT(*) FROM checkins c WHERE c.event_id = ?1) AS checked_in,
              SUM(r.status = 'registered' AND r.payment_status = 'paid') AS paid,
              SUM(r.status = 'registered' AND r.payment_status = 'unpaid') AS unpaid,
              SUM(r.status = 'registered' AND r.payment_status = 'unpaid' AND r.upi_utr IS NOT NULL) AS to_verify
         FROM registrations r WHERE r.event_id = ?1`,
      id,
    ),
    listAttendees(db, id, q),
    all<{ id: string; kind: string; body: string; created_at: string; notified: number }>("SELECT id, kind, body, created_at, notified FROM event_updates WHERE event_id = ? ORDER BY created_at DESC LIMIT 10", id),
    waPanel(db, id),
    count(
      `SELECT COUNT(*) AS n FROM registrations r JOIN users u ON u.id = r.user_id
        WHERE r.event_id = ? AND r.status = 'registered' AND u.whatsapp_opt_in = 1 AND u.phone IS NOT NULL`,
      id,
    ),
    eventCertificates(db, id),
    listMerch(db, id),
    merchCollected(db, id),
    listQuestions(db, id),
    eventAnswers(db, id),
  ]);
  const s = { registered: stats?.registered ?? 0, waitlisted: stats?.waitlisted ?? 0, checkedIn: stats?.checked_in ?? 0, paid: stats?.paid ?? 0, unpaid: stats?.unpaid ?? 0, toVerify: stats?.to_verify ?? 0 };
  const paidEvent = e.price_paise > 0;
  const connected = whatsappConnected();
  const shown = showAll ? attendees : attendees.slice(0, PAGE);

  return (
    <div className="space-y-5 pt-4 md:pt-6">
      <Link href="/organizer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink"><ArrowLeft className="size-4" /> Your events</Link>

      <PageHero
        eyebrow={`Manage event · ${e.status}`}
        title={e.title}
        sub={
          <>
            {fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })} · {fmtRange(new Date(e.starts_at), new Date(e.ends_at))} · {e.venue}
            {e.access === "code" && e.access_code && <> · code <span className="font-mono font-bold text-ink">{e.access_code}</span></>}
          </>
        }
        actions={
          <>
            {e.status === "published" && <Link href={`/organizer/scan/${e.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-volt px-4 py-2.5 text-[13.5px] font-bold text-ink-inverse hover:bg-volt-hover"><ScanLine className="size-4" aria-hidden /> Gate scanner</Link>}
            {e.status !== "draft" && <Link href={`/events/${e.slug}/photos`} className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold hover:bg-white/15"><Camera className="size-4" aria-hidden /> Photos</Link>}
            <Link href={`/organizer/events/${e.id}`} className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold hover:bg-white/15"><Pencil className="size-4" aria-hidden /> Edit</Link>
          </>
        }
      />

      <dl className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${paidEvent ? "lg:grid-cols-5" : ""}`}>
        {[
          ["Registered", e.capacity === null ? `${s.registered}` : `${s.registered} / ${e.capacity}`],
          ["Waitlist", String(s.waitlisted)],
          ["Checked in", String(s.checkedIn)],
          ...(paidEvent
            ? [
                ["Collected", s.paid ? formatINR(s.paid * e.price_paise) : "₹0"],
                ["To verify", `${s.toVerify} · ${s.unpaid - s.toVerify} unpaid`],
              ]
            : [["Entry", "Free"]]),
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <dt className="text-[12px] font-semibold text-ink-subtle">{label}</dt>
            <dd className="mt-1 font-mono text-[20px] font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5">
          <h2 className="title-xl text-[32px]">Post an update</h2>
          {e.status === "draft" ? (
            <p className="rounded-2xl bg-canvas p-4 text-[14px] font-semibold text-ink-2">Publish the event first, then you can post updates.</p>
          ) : (
            <UpdateComposer eventId={e.id} optedIn={optedIn} connected={connected} />
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[16px] font-bold"><MessageCircle className="size-4 text-ink-subtle" /> WhatsApp</h2>
            <span className="font-mono text-[13px] tabular-nums">{outbox.optedIn} opted in</span>
          </div>
          <ul className="mt-3 divide-y divide-line text-[13.5px]">
            {outbox.next.map((n) => (
              <li key={n.at + n.template} className="flex justify-between gap-3 py-2">
                <span className="font-mono text-[12.5px]">{istLabel(n.at)}</span>
                <span className="text-ink-muted">{WA_LABEL[n.template] ?? n.template.replace(/_/g, " ")}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 py-2">
              <span>Sent this event</span>
              <span className="font-mono tabular-nums">{outbox.mostSentToOne} of {MAX_PER_EVENT} allowed</span>
            </li>
            {outbox.dryRun > 0 && (
              <li className="flex justify-between gap-3 py-2">
                <span>Dry run</span>
                <span className="font-mono tabular-nums">{outbox.dryRun} messages</span>
              </li>
            )}
            {outbox.failed > 0 && (
              <li className="flex justify-between gap-3 py-2 text-danger">
                <span>Failed</span>
                <span className="font-mono tabular-nums">{outbox.failed}</span>
              </li>
            )}
          </ul>
          <WaTestButton eventId={e.id} />
          <h3 className="mt-4 text-[13px] font-bold uppercase tracking-[0.08em] text-ink-subtle">Recent updates</h3>
          {updates.length === 0 ? (
            <p className="mt-1 text-[13.5px] text-ink-muted">None yet.</p>
          ) : (
            <ul className="mt-2 space-y-2.5">
              {updates.map((u) => (
                <li key={u.id} className="text-[13.5px]">
                  <span className="font-semibold">{UPDATE_LABEL[u.kind] ?? "Update"}</span> <span className="text-ink-muted">· {relative(new Date(u.created_at))}{u.notified ? " · WhatsApp" : ""}</span>
                  <p className="text-ink-2">{u.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="title-xl mb-3 text-[32px]">Certificates</h2>
        <CertPanel eventId={e.id} issued={certs.filter((c) => c.kind === "participation").length} checkedIn={s.checkedIn} enabled={e.certificates_enabled === 1} />
      </section>

      {merch.length > 0 && (
        <section className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="title-xl text-[32px]">Merch</h2>
            <a href={`/api/events/${e.id}/merch/claims.csv`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold hover:border-volt/60"><Download className="size-4" /> CSV</a>
          </div>
          <ul className="divide-y divide-line font-mono text-[13px]">
            {merch.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="font-sans font-semibold">{m.variant ? `${m.name} · ${m.variant}` : m.name}</span>
                <span className="text-ink-muted">
                  {m.claimed} claimed · {m.left === null ? "unlimited" : `${m.left} left`}
                  {m.left === 0 && <b className="ml-2 text-warn">SOLD OUT</b>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13.5px] text-ink-muted">Collected {collected.collected} of {collected.passes} passes</p>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="title-xl text-[32px]">Attendees <span className="font-mono text-[15px] text-ink-muted tabular-nums">({attendees.length}{q ? " found" : ""})</span></h2>
          <div className="flex flex-wrap items-center gap-2">
            <form className="flex h-10 items-center rounded-full border border-line bg-surface pl-3.5 pr-1 transition-colors focus-within:border-volt/70">
              <Search className="size-4 text-ink-subtle" />
              <input name="q" defaultValue={q} placeholder="Name, email or pass code" aria-label="Search attendees" className="w-48 bg-transparent px-2 text-[13.5px] focus:outline-none" />
              <button className="rounded-full bg-volt px-3 py-1.5 text-[12.5px] font-semibold text-ink-inverse">Search</button>
            </form>
            <a href={`/api/events/${e.id}/attendees?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold hover:border-volt/60">
              <Download className="size-4" /> CSV
            </a>
          </div>
        </div>

        {attendees.length === 0 ? (
          <p className="p-6 text-[14px] text-ink-muted">{q ? `Nobody matches “${q}”.` : "No registrations yet."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead className="bg-canvas text-[12px] font-semibold text-ink-subtle">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Name</th>
                  <th scope="col" className="px-4 py-2.5">Pass</th>
                  <th scope="col" className="px-4 py-2.5">Status</th>
                  <th scope="col" className="px-4 py-2.5">Checked in</th>
                  <th scope="col" className="px-4 py-2.5">Certificate</th>
                  {paidEvent && <th scope="col" className="px-4 py-2.5">Payment</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-[12px] text-ink-muted">{a.email}</p>
                      {questions.filter((q) => answers.get(a.id)?.[q.id]).map((q) => (
                        <p key={q.id} className="text-[12px] text-ink-2">{q.label}: {answers.get(a.id)?.[q.id]}</p>
                      ))}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12.5px]">{a.pass_code}</td>
                    <td className="px-4 py-2.5">
                      {a.status === "registered" ? <Chip tone="outline">Registered</Chip> : a.hold_expires_at ? <Chip tone="warn">Seat held</Chip> : <Chip>Waitlist</Chip>}
                    </td>
                    <td className="px-4 py-2.5">{a.checked_in_at ? <span className="font-semibold text-live">{fmtTime(new Date(a.checked_in_at))}</span> : <span className="text-ink-subtle">—</span>}</td>
                    <td className="px-4 py-2.5">{a.checked_in_at ? <AttendeeCert regId={a.id} certs={certs.filter((c) => c.registrationId === a.id)} /> : <span className="text-ink-subtle">—</span>}</td>
                    {paidEvent && (
                      <td className="px-4 py-2.5">
                        {a.status === "registered" ? <PaymentCell regId={a.id} paid={a.payment_status === "paid"} method={a.payment_method} refCode={a.payment_ref} utr={a.upi_utr} /> : <span className="text-ink-subtle">—</span>}
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
            Showing {shown.length} of {attendees.length}.{" "}
            <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), all: "1" })}`} className="font-semibold text-ink underline">Show all</Link> or download the CSV.
          </p>
        )}
      </section>
    </div>
  );
}
