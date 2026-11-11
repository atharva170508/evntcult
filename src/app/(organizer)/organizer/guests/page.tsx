import type { Metadata } from "next";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { formatAmount } from "@/lib/money";
import { organizerEvents } from "@/lib/data/organizer-events";
import { listAttendees, type AttendeeRow } from "@/lib/data/organizer-actions";
import { istTime, ticketDate } from "@/lib/organizer/shared";
import { Table } from "@/components/ui/Table";
import { Chip } from "@/components/ui/Chip";
import { Menu } from "@/components/ui/Menu";
import { buttonClass } from "@/components/ui/Button";
import { PaymentCell } from "@/components/organizer/PaymentCell";
import { UndoCheckinButton } from "@/components/organizer/UndoCheckinButton";

export const metadata: Metadata = { title: "Guests" };
export const dynamic = "force-dynamic";

/** Where a guest's money stands. Started payment = they sent a UPI ID we haven't confirmed; cash = nothing yet. */
function money(a: AttendeeRow, pricePaise: number): "free" | "paid" | "started" | "cash" {
  if (pricePaise === 0) return "free";
  if (a.payment_status === "paid") return "paid";
  return a.upi_utr ? "started" : "cash";
}
const MONEY_LABEL = { free: "Free", paid: "Paid", started: "Started payment", cash: "Cash to collect" } as const;
const MONEY_TONE = { free: "neutral", paid: "live", started: "warn", cash: "warn" } as const;

/**
 * §9 Guests: the list, the money, the claims. Split numbers on top (started payment vs cash to collect),
 * payment labels, check-in times, row actions. Never shows phone numbers.
 */
export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ event?: string; q?: string }> }) {
  const viewer = (await getViewer())!;
  const { event: eventParam, q } = await searchParams;
  const db = await getDB();
  const events = (await organizerEvents(db, viewer.id)).filter((e) => e.status !== "draft");
  const now = new Date().toISOString();
  const event =
    events.find((e) => e.id === eventParam) ??
    events.find((e) => e.ends_at > now && e.status === "published") ??
    [...events].reverse()[0];

  const header = (
    <header className="o-top">
      <div className="o-crumb">
        <b>Guests</b>
        {event && <> · {event.title}</>}
      </div>
      <span className="o-spacer" />
      {events.length > 1 && (
        <Menu
          label="Switch event"
          align="end"
          items={events.map((e) => ({ label: `${ticketDate(e.starts_at)} · ${e.title}`, href: `/organizer/guests?event=${e.id}` }))}
        />
      )}
    </header>
  );

  if (!event) {
    return (
      <>
        {header}
        <div className="o-page">
          <h1 className="o-title">Guests</h1>
          <div className="mt-6 flex flex-col items-start gap-3 border-y border-line py-8">
            <p className="text-body">Publish an event and the people who register show up here.</p>
            <Link href="/organizer/events/new" className={buttonClass("secondary", "sm")}>
              Create event
            </Link>
          </div>
        </div>
      </>
    );
  }

  const [all, shown] = await Promise.all([listAttendees(db, event.id), q ? listAttendees(db, event.id, q) : null]);
  const rows = shown ?? all;
  const seated = all.filter((a) => a.status === "registered");
  const sum = (k: ReturnType<typeof money>) => seated.filter((a) => money(a, event.price_paise) === k);
  const paid = sum("paid"), started = sum("started"), cash = sum("cash");
  const inside = seated.filter((a) => a.checked_in_at).length;
  const paidEvent = event.price_paise > 0;

  const stats = [
    { label: "Registered", value: String(seated.length), hint: event.capacity ? `of ${event.capacity}` : "no limit" },
    { label: "Checked in", value: String(inside), hint: seated.length ? `${Math.round((inside / seated.length) * 100)}%` : "—" },
    ...(paidEvent
      ? [
          { label: "Paid", value: formatAmount(paid.length * event.price_paise), hint: `${paid.length} passes` },
          { label: "Started payment", value: formatAmount(started.length * event.price_paise), hint: `${started.length} UPI IDs to confirm` },
          { label: "Cash to collect", value: formatAmount(cash.length * event.price_paise), hint: `${cash.length} passes` },
        ]
      : []),
  ];

  return (
    <>
      {header}
      <div className="o-page flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {ticketDate(event.starts_at)} · {istTime(new Date(event.starts_at))}
            </p>
            <h1 className="o-title mt-1">{event.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/organizer/scan/${event.id}`} className={buttonClass("primary", "sm")}>
              Open gate
            </Link>
            <a href={`/api/events/${event.id}/attendees?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={buttonClass("secondary", "sm")}>
              Download CSV
            </a>
            <Link href={`/organizer/events/${event.id}/manage`} className={buttonClass("ghost", "sm")}>
              Updates and certificates ›
            </Link>
          </div>
        </div>

        {/* §9: split numbers. */}
        <dl className="grid grid-cols-2 border-t border-line md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="border-b border-r border-line py-3 pl-3 first:pl-0 md:[&:nth-child(5n)]:border-r-0">
              <dt className="text-label text-ink-muted">{s.label}</dt>
              <dd className="mt-1 font-mono text-title font-medium tabular-nums">{s.value}</dd>
              <dd className="font-mono text-caption text-ink-subtle">{s.hint}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="list-h" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="list-h" className="text-heading">
              {q ? `${rows.length} found` : `${all.length} guests`}
            </h2>
            <form role="search" className="flex w-full items-center gap-2 sm:w-auto">
              <input type="hidden" name="event" value={event.id} />
              <label htmlFor="guest-q" className="sr-only">
                Search guests
              </label>
              <input
                id="guest-q"
                name="q"
                defaultValue={q}
                placeholder="Name, email, pass code or UPI ID"
                className="h-10 min-w-0 flex-1 rounded-sm border border-line-strong bg-surface px-3 text-body-sm placeholder:text-ink-subtle sm:w-64 sm:flex-none"
              />
              <button className={buttonClass("secondary", "md")}>Search</button>
              {q && (
                <Link href={`/organizer/guests?event=${event.id}`} className={buttonClass("ghost", "md")}>
                  Clear
                </Link>
              )}
            </form>
          </div>

          <Table
            caption={`Guests for ${event.title}`}
            rows={rows}
            rowKey={(a) => a.id}
            empty={{ sentence: q ? `Nobody matches “${q}”.` : "Nobody has registered yet. Share the event link to get started." }}
            columns={[
              {
                key: "n",
                header: "Name",
                cell: (a) => (
                  <span className="block min-w-0">
                    <span className="block truncate font-semibold">{a.name}</span>
                    <span className="block truncate text-label text-ink-muted">{a.email}</span>
                  </span>
                ),
              },
              { key: "p", header: "Pass", cell: (a) => <span className="font-mono text-label">{a.pass_code}</span> },
              {
                key: "s",
                header: "Seat",
                cell: (a) => (a.status === "registered" ? <span className="text-ink-muted">Confirmed</span> : <Chip tone="warn">{a.hold_expires_at ? "Seat held" : "Waitlist"}</Chip>),
              },
              {
                key: "m",
                header: "Payment",
                cell: (a) => {
                  const m = money(a, event.price_paise);
                  if (a.status !== "registered") return <span className="text-ink-subtle">—</span>;
                  return paidEvent ? (
                    <div className="flex flex-col gap-1 py-2">
                      <Chip tone={MONEY_TONE[m]} className="w-fit">
                        {MONEY_LABEL[m]}
                      </Chip>
                      <PaymentCell regId={a.id} paid={a.payment_status === "paid"} method={a.payment_method} refCode={a.payment_ref} utr={a.upi_utr} />
                    </div>
                  ) : (
                    <span className="text-ink-muted">Free</span>
                  );
                },
              },
              {
                key: "c",
                header: "Checked in",
                numeric: true,
                cell: (a) => (a.checked_in_at ? <span>{istTime(new Date(a.checked_in_at))}</span> : <span className="text-ink-subtle">—</span>),
              },
              { key: "a", header: "", cell: (a) => (a.checked_in_at ? <UndoCheckinButton regId={a.id} name={a.name} /> : null) },
            ]}
          />
        </section>
      </div>
    </>
  );
}
