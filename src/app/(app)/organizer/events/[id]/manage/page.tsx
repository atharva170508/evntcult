import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Award, CalendarDays, Camera, Download, KeyRound, MapPin, Megaphone, MessageCircle, Pencil, ScanLine, Search, Shirt, Users } from "lucide-react";
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
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";
import { Notice } from "@/components/ui/Field";
import { SlashFocus } from "@/components/organizer/SlashFocus";

export const metadata: Metadata = { title: "Manage event" };
export const dynamic = "force-dynamic";

const WA_LABEL: Record<string, string> = { event_reminder: "reminder", event_soon: "gate opens", payment_pending: "payment nudge", event_updated: "update", event_cancelled: "cancelled" };
const UPDATE_LABEL: Record<string, string> = { schedule: "Schedule change", venue: "Venue change", update: "Update" };
const PAGE = 100;

export default async function ManageEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; all?: string; f?: string }> }) {
  const [{ id }, { q, all: showAll, f: filterParam }] = await Promise.all([params, searchParams]);
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
  // Filter tabs, Linear style: counted from the same list so the numbers always match the rows.
  const isVerify = (a: (typeof attendees)[number]) => a.status === "registered" && a.payment_status === "unpaid" && !!a.upi_utr;
  const FILTERS = [
    { key: "all", label: "All", test: () => true },
    { key: "in", label: "Checked in", test: (a: (typeof attendees)[number]) => !!a.checked_in_at },
    { key: "out", label: "Not in yet", test: (a: (typeof attendees)[number]) => a.status === "registered" && !a.checked_in_at },
    ...(paidEvent ? [{ key: "verify", label: "To verify", test: isVerify }] : []),
    { key: "wait", label: "Waitlist", test: (a: (typeof attendees)[number]) => a.status === "waitlisted" },
  ];
  const filter = FILTERS.find((x) => x.key === filterParam) ?? FILTERS[0];
  const filtered = attendees.filter(filter.test);
  const shown = showAll ? filtered : filtered.slice(0, PAGE);
  const filterHref = (key: string) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(key !== "all" ? { f: key } : {}) });
    const str = p.toString();
    return str ? `?${str}` : "?";
  };

  const statusTone = e.status === "published" ? "live" : e.status === "draft" ? "warn" : e.status === "cancelled" ? "danger" : "neutral";
  const th = "px-4 py-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em]";
  const kpis: { l: string; v: string; sub?: string; meter?: [number, number | null]; tone?: "warn" }[] = [
    { l: "Registered", v: String(s.registered), sub: e.capacity === null ? "No limit" : `of ${e.capacity}`, meter: [s.registered, e.capacity] },
    { l: "Checked in", v: String(s.checkedIn), sub: s.registered ? `${Math.round((s.checkedIn / Math.max(1, s.registered)) * 100)}% of registered` : "—", meter: [s.checkedIn, Math.max(1, s.registered)] },
    { l: "Waitlist", v: String(s.waitlisted) },
    ...(paidEvent
      ? [
          { l: "Collected", v: s.paid ? formatINR(s.paid * e.price_paise) : "₹0", sub: `${s.paid} paid` },
          { l: "To verify", v: String(s.toVerify), sub: `${s.unpaid - s.toVerify} unpaid`, tone: s.toVerify ? ("warn" as const) : undefined },
        ]
      : [{ l: "Entry", v: "Free" }]),
  ];

  return (
    <div className="pb-8">
      {/* Toolbar */}
      <div className="sticky top-[var(--header-h)] z-20 -mx-gutter flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-canvas px-gutter py-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-ink-muted">
          <Link href="/organizer" className="transition-colors hover:text-ink">
            Events
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate font-semibold text-ink">{e.title}</span>
        </nav>
        <Chip tone={statusTone}>{e.status[0].toUpperCase() + e.status.slice(1)}</Chip>
        <span className="flex-1" />
        <div className="flex flex-wrap gap-2">
          {e.status !== "draft" && (
            <LinkButton href={`/events/${e.slug}`} variant="ghost" size="sm">
              View page
            </LinkButton>
          )}
          {e.status !== "draft" && (
            <LinkButton href={`/events/${e.slug}/photos`} variant="secondary" size="sm">
              <Camera className="size-3.5" aria-hidden /> Photos
            </LinkButton>
          )}
          <LinkButton href={`/organizer/events/${e.id}`} variant="secondary" size="sm">
            <Pencil className="size-3.5" aria-hidden /> Edit
          </LinkButton>
          {e.status === "published" && (
            <LinkButton href={`/organizer/scan/${e.id}`} size="sm">
              <ScanLine className="size-3.5" aria-hidden /> Gate scanner
            </LinkButton>
          )}
        </div>
      </div>

      {/* Title */}
      <header className="pt-8">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] md:text-[32px]">{e.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-ink-subtle" aria-hidden />
            {fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })} · {fmtRange(new Date(e.starts_at), new Date(e.ends_at))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-subtle" aria-hidden /> {e.venue}
          </span>
          {e.access === "code" && e.access_code && (
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="size-4 text-ink-subtle" aria-hidden /> Code <span className="font-mono font-medium tracking-[0.12em] text-ink">{e.access_code}</span>
            </span>
          )}
        </p>
      </header>

      {/* KPIs */}
      <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-line-strong bg-white sm:flex sm:divide-x sm:divide-line">
        {kpis.map((k, i) => (
          <div
            key={k.l}
            className={`min-w-0 px-4 py-3.5 sm:flex-1 ${i % 2 ? "border-l border-line sm:border-l-0" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === kpis.length - 1 && kpis.length % 2 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <dt className="text-[12.5px] text-ink-muted">{k.l}</dt>
            <dd className="mt-1 flex items-baseline gap-2">
              <span className={`font-mono text-[22px] font-medium leading-none tracking-[-0.03em] tabular-nums ${k.tone === "warn" ? "text-warn" : "text-ink"}`}>{k.v}</span>
              {k.sub && <span className="truncate text-[12px] text-ink-subtle">{k.sub}</span>}
            </dd>
            {k.meter && <Meter value={k.meter[0]} max={k.meter[1]} className="mt-2.5" />}
          </div>
        ))}
      </dl>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Attendees — the main job */}
        <section aria-labelledby="att-h" className="card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 md:px-5">
            <h2 id="att-h" className="text-h4 font-semibold">
              Attendees{" "}
              <span className="ml-1 font-mono text-[13px] font-normal tabular-nums text-ink-muted">
                {attendees.length}
                {q ? " found" : ""}
              </span>
            </h2>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <form role="search" className="flex h-9 flex-1 items-center gap-2 rounded-full bg-sunken/70 pl-3.5 pr-1 transition-[background-color,box-shadow] focus-within:bg-surface focus-within:shadow-card sm:flex-none">
                <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                {filter.key !== "all" && <input type="hidden" name="f" value={filter.key} />}
                <input id="att-search" name="q" type="search" defaultValue={q} placeholder="Name, email, pass or UTR" aria-label="Search attendees" aria-keyshortcuts="/" className="w-full min-w-0 bg-transparent text-[13.5px] focus:outline-none sm:w-52" />
                <kbd className="hidden rounded border border-line-strong bg-white px-1.5 font-mono text-[11px] text-ink-muted md:inline" aria-hidden>
                  /
                </kbd>
                <button className={buttonClass("primary", "sm", "h-7")}>Search</button>
              </form>
              <a href={`/api/events/${e.id}/attendees?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={buttonClass("secondary", "sm", "h-9")}>
                <Download className="size-3.5" aria-hidden /> CSV
              </a>
            </div>
          </div>

          <nav aria-label="Filter attendees" className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:px-4">
            {FILTERS.map((x) => {
              const n = attendees.filter(x.test).length;
              const on = x.key === filter.key;
              return (
                <Link
                  key={x.key}
                  href={filterHref(x.key)}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium transition-colors duration-fast ${on ? "bg-ink text-white" : "text-ink-2 hover:bg-sunken"}`}
                >
                  {x.label}
                  <span className={`font-mono text-[12px] tabular-nums ${on ? "text-white/70" : x.key === "verify" && n ? "font-semibold text-warn" : "text-ink-subtle"}`}>{n}</span>
                </Link>
              );
            })}
          </nav>
          <SlashFocus target="att-search" />

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="grid size-11 place-items-center rounded-tile bg-sunken text-ink-muted">
                <Users className="size-5" aria-hidden />
              </span>
              <p className="mt-4 text-h4 font-semibold">
                {q ? `Nobody matches “${q}”` : attendees.length === 0 ? "No registrations yet" : filter.key === "verify" ? "No payments to check" : `Nobody in “${filter.label}”`}
              </p>
              {!q && attendees.length === 0 && e.status === "published" && <p className="mt-1 text-small text-ink-muted">Share the event link to get your first sign-ups.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13.5px]">
                <thead className="border-b border-line bg-[#faf9f7] text-ink-subtle">
                  <tr>
                    <th scope="col" className={th}>Name</th>
                    <th scope="col" className={th}>Pass</th>
                    <th scope="col" className={th}>Status</th>
                    <th scope="col" className={th}>Checked in</th>
                    <th scope="col" className={th}>Certificate</th>
                    {paidEvent && <th scope="col" className={th}>Payment</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {shown.map((a) => (
                    <tr key={a.id} className="align-top transition-colors hover:bg-[#faf9f7]">
                      <td className="px-4 py-3">
                        <p className="font-medium">{a.name}</p>
                        <p className="text-[12px] text-ink-muted">{a.email}</p>
                        {questions
                          .filter((qq) => answers.get(a.id)?.[qq.id])
                          .map((qq) => (
                            <p key={qq.id} className="mt-0.5 text-[12px] text-ink-2">
                              <span className="text-ink-subtle">{qq.label}:</span> {answers.get(a.id)?.[qq.id]}
                            </p>
                          ))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] tracking-[0.06em]">{a.pass_code}</td>
                      <td className="px-4 py-3">{a.status === "registered" ? <Chip tone="outline">Registered</Chip> : a.hold_expires_at ? <Chip tone="warn">Seat held</Chip> : <Chip>Waitlist</Chip>}</td>
                      <td className="px-4 py-3">{a.checked_in_at ? <span className="font-mono font-medium text-live">{fmtTime(new Date(a.checked_in_at))}</span> : <span className="text-ink-subtle">—</span>}</td>
                      <td className="px-4 py-3">{a.checked_in_at ? <AttendeeCert regId={a.id} certs={certs.filter((c) => c.registrationId === a.id)} /> : <span className="text-ink-subtle">—</span>}</td>
                      {paidEvent && (
                        <td className="px-4 py-3">
                          {a.status === "registered" ? <PaymentCell regId={a.id} paid={a.payment_status === "paid"} method={a.payment_method} refCode={a.payment_ref} utr={a.upi_utr} /> : <span className="text-ink-subtle">—</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > shown.length && (
            <p className="border-t border-line px-5 py-4 text-[13px] text-ink-muted">
              Showing <span className="font-mono">{shown.length}</span> of <span className="font-mono">{filtered.length}</span>.{" "}
              <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(filter.key !== "all" ? { f: filter.key } : {}), all: "1" })}`} className="link">
                Show all
              </Link>{" "}
              or download the CSV.
            </p>
          )}
        </section>

        {/* Side panels */}
        <div className="space-y-5">
          <section aria-labelledby="upd-h" className="card p-5">
            <h2 id="upd-h" className="flex items-center gap-2 text-h4 font-semibold">
              <Megaphone className="size-4 text-ink-subtle" aria-hidden /> Post an update
            </h2>
            <p className="mb-4 mt-1 text-[12.5px] text-ink-muted">Shows on attendees&apos; dashboards straight away.</p>
            {e.status === "draft" ? <Notice>Publish the event first, then you can post updates.</Notice> : <UpdateComposer eventId={e.id} optedIn={optedIn} connected={connected} />}
            {updates.length > 0 && (
              <>
                <h3 className="eyebrow mt-6 border-t border-line pt-5">Recent updates</h3>
                <ol className="mt-3 space-y-3">
                  {updates.map((u) => (
                    <li key={u.id} className="text-[13.5px]">
                      <p>
                        <span className="font-medium">{UPDATE_LABEL[u.kind] ?? "Update"}</span>{" "}
                        <span className="text-ink-subtle">
                          · {relative(new Date(u.created_at))}
                          {u.notified ? " · WhatsApp" : ""}
                        </span>
                      </p>
                      <p className="mt-0.5 text-ink-2">{u.body}</p>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>

          <section aria-labelledby="wa-h" className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="wa-h" className="flex items-center gap-2 text-h4 font-semibold">
                <MessageCircle className="size-4 text-ink-subtle" aria-hidden /> WhatsApp
              </h2>
              <Chip tone={connected ? "live" : "warn"}>{connected ? "Connected" : "Not connected"}</Chip>
            </div>
            <p className="mt-2 text-[13px] text-ink-muted">
              <span className="font-mono tabular-nums text-ink">{outbox.optedIn}</span> attendees opted in
            </p>
            <ul className="mt-3 divide-y divide-line/70 text-[13.5px]">
              {outbox.next.map((n) => (
                <li key={n.at + n.template} className="flex justify-between gap-3 py-2.5">
                  <span className="font-mono text-[12.5px]">{istLabel(n.at)}</span>
                  <span className="text-ink-muted">{WA_LABEL[n.template] ?? n.template.replace(/_/g, " ")}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 py-2.5">
                <span className="text-ink-2">Sent this event</span>
                <span className="font-mono tabular-nums">
                  {outbox.mostSentToOne} / {MAX_PER_EVENT}
                </span>
              </li>
              {outbox.dryRun > 0 && (
                <li className="flex justify-between gap-3 py-2.5">
                  <span className="text-ink-2">Dry run</span>
                  <span className="font-mono tabular-nums">{outbox.dryRun}</span>
                </li>
              )}
              {outbox.failed > 0 && (
                <li className="flex justify-between gap-3 py-2.5 text-danger">
                  <span>Failed</span>
                  <span className="font-mono tabular-nums">{outbox.failed}</span>
                </li>
              )}
            </ul>
            <div className="mt-3">
              <WaTestButton eventId={e.id} />
            </div>
          </section>

          <section aria-labelledby="cert-h" className="card p-5">
            <h2 id="cert-h" className="mb-4 flex items-center gap-2 text-h4 font-semibold">
              <Award className="size-4 text-ink-subtle" aria-hidden /> Certificates
            </h2>
            <CertPanel eventId={e.id} issued={certs.filter((c) => c.kind === "participation").length} checkedIn={s.checkedIn} enabled={e.certificates_enabled === 1} />
          </section>

          {merch.length > 0 && (
            <section aria-labelledby="merch-h" className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="merch-h" className="flex items-center gap-2 text-h4 font-semibold">
                  <Shirt className="size-4 text-ink-subtle" aria-hidden /> Merch
                </h2>
                <a href={`/api/events/${e.id}/merch/claims.csv`} className={buttonClass("secondary", "sm")}>
                  <Download className="size-3.5" aria-hidden /> CSV
                </a>
              </div>
              <ul className="divide-y divide-line/70 text-[13.5px]">
                {merch.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <span className="font-medium">{m.variant ? `${m.name} · ${m.variant}` : m.name}</span>
                    <span className="font-mono text-[12.5px] text-ink-muted">
                      {m.claimed} claimed · {m.left === null ? "unlimited" : `${m.left} left`}
                      {m.left === 0 && <b className="ml-2 font-medium text-warn">Sold out</b>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] text-ink-muted">
                Collected <span className="font-mono text-ink">{collected.collected}</span> of <span className="font-mono">{collected.passes}</span> passes
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
