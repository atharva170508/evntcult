import type { Metadata } from "next";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { organizerEvents, type HomeEvent } from "@/lib/data/organizer-events";
import { MISSING_LABEL, istTime, missingForPublish, ticketDate } from "@/lib/organizer/shared";
import { ArrowRight, CalendarPlus, CalendarRange, Plus } from "lucide-react";
import { DuplicateButton } from "@/components/organizer-ui/EventActions";
import { EventArt } from "@/components/ui/EventArt";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { LinkButton, buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Your events" };
export const dynamic = "force-dynamic";

const CAT_ACCENT: Record<string, string> = { PARTY: "violet", CULTURAL: "pink", TECH: "blue", GAMING: "teal", SPORTS: "orange", WORKSHOP: "green", TALK: "red" };

function EventRow({ e, draft }: { e: HomeEvent; draft?: boolean }) {
  const missing = draft ? missingForPublish(e).map((m) => MISSING_LABEL[m]) : [];
  const start = new Date(e.starts_at);
  const live = !draft && +start <= Date.now() && Date.parse(e.ends_at) > Date.now();
  return (
    <li className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-t border-line/70 px-4 py-3.5 first:border-t-0 sm:px-5 md:grid-cols-[56px_minmax(0,1fr)_200px_140px_auto]">
      <div className="relative isolate grid h-14 w-14 place-items-center overflow-hidden rounded-xl text-center text-white">
        <EventArt accent={CAT_ACCENT[e.category ?? ""] ?? "blue"} seed={e.id} scrim={false} flat />
        <div className="relative leading-none">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.08em]">{ticketDate(e.starts_at).split(" ")[2]}</div>
          <div className="mt-0.5 text-[19px] font-semibold tabular-nums">{ticketDate(e.starts_at).split(" ")[1]}</div>
        </div>
      </div>
      <div className="min-w-0">
        <Link href={draft ? `/organizer/events/${e.id}` : `/organizer/events/${e.id}/manage`} className="block truncate text-[15px] font-semibold tracking-[-0.01em] hover:underline hover:decoration-line-strong hover:underline-offset-4">
          {e.title || "Untitled event"}
        </Link>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
          <span className="font-mono">{istTime(start)}</span>
          {" · "}
          {draft ? (missing.length ? <span className="text-warn">Needs {missing.join(", ").toLowerCase()}</span> : "Ready to publish") : e.venue_status === "tba" ? "Venue TBA" : e.venue}
        </p>
      </div>
      <div className="hidden md:block">
        {draft ? (
          <Chip tone="warn">Draft</Chip>
        ) : live ? (
          <Chip tone="accent" pulse>
            Live now
          </Chip>
        ) : (
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[12px] tabular-nums">
              <span>{e.taken}</span>
              <span className="text-ink-subtle">{e.capacity === null ? "no limit" : `/ ${e.capacity}`}</span>
            </div>
            <Meter value={e.taken} max={e.capacity} />
          </div>
        )}
      </div>
      <div className="hidden text-right font-mono text-[13px] tabular-nums md:block">{e.price_paise ? formatINR(e.price_paise) : <span className="text-live">Free</span>}</div>
      <div className="flex items-center justify-end gap-1.5">
        <span className="hidden lg:inline-flex">
          <DuplicateButton id={e.id} />
        </span>
        {draft ? (
          <LinkButton href={`/organizer/events/${e.id}`} size="sm">
            Finish setup
          </LinkButton>
        ) : (
          <LinkButton href={`/organizer/events/${e.id}/manage`} size="sm" variant="secondary">
            Manage <ArrowRight className="size-3.5" aria-hidden />
          </LinkButton>
        )}
      </div>
    </li>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 className="text-h4 font-semibold">{title}</h2>
        <span className="font-mono text-[12px] tabular-nums text-ink-subtle">{count}</span>
      </div>
      <ul className="card overflow-hidden">{children}</ul>
    </section>
  );
}

export default async function OrganizerHome() {
  const viewer = (await getViewer())!;
  const db = await getDB();
  const events = await organizerEvents(db, viewer.id);
  const money = await db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN e.price_paise END), 0) AS collected,
              COALESCE(SUM(CASE WHEN r.payment_status = 'unpaid' AND r.upi_utr IS NOT NULL THEN e.price_paise END), 0) AS to_verify
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.organizer_id = ? AND r.status = 'registered' AND e.price_paise > 0`,
    )
    .bind(viewer.id)
    .first<{ collected: number; to_verify: number }>();
  const nowIso = new Date().toISOString();
  const drafts = events.filter((e) => e.status === "draft");
  const upcoming = events.filter((e) => e.status === "published" && e.ends_at > nowIso);
  const past = events.filter((e) => e.status !== "draft" && !upcoming.includes(e)).reverse().slice(0, 12);

  const registrations = upcoming.reduce((a, e) => a + e.taken, 0);
  const firstName = viewer.name.split(/\s+/)[0] ?? "there";

  return (
    <div className="pb-8 pt-8 md:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <h1 className="font-display text-[clamp(40px,5vw,56px)] leading-none tracking-[-0.03em]">
          Welcome back, <em>{firstName}</em>
        </h1>
        <div className="flex flex-wrap gap-2 md:hidden">
          <LinkButton href="/organizer/calendar" variant="secondary">
            <CalendarRange className="size-4" aria-hidden /> Calendar
          </LinkButton>
          <Link href="/organizer/events/new" className={buttonClass("primary", "md")}>
            <Plus className="size-4" aria-hidden /> Create event
          </Link>
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card bg-line shadow-card lg:grid-cols-4">
        {[
          { l: "Upcoming events", v: String(upcoming.length) },
          { l: "Registrations (upcoming)", v: registrations.toLocaleString("en-IN") },
          { l: "Fees collected", v: money?.collected ? formatINR(money.collected) : "₹0" },
          { l: "UPI to verify", v: money?.to_verify ? formatINR(money.to_verify) : "₹0", warn: !!money?.to_verify },
        ].map((k) => (
          <div key={k.l} className="bg-surface p-5">
            <dt className="text-[12.5px] text-ink-muted">{k.l}</dt>
            <dd className={k.warn ? "mt-3 font-mono text-[28px] font-medium leading-none tracking-[-0.04em] tabular-nums text-warn" : "mt-3 font-mono text-[28px] font-medium leading-none tracking-[-0.04em] tabular-nums"}>{k.v}</dd>
          </div>
        ))}
      </dl>

      {events.length === 0 ? (
        <section className="card relative isolate mt-10 flex flex-col items-start overflow-hidden p-8 md:p-12">
          <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_80%_at_100%_0%,black,transparent_70%)]" />
          <span className="grid size-11 place-items-center rounded-tile bg-sunken text-ink-2">
            <CalendarPlus className="size-5" aria-hidden />
          </span>
          <h2 className="mt-6 max-w-md text-display-md font-semibold">
            Host your first <em>event.</em>
          </h2>
          <p className="mt-3 max-w-md text-body text-ink-muted">Set the time and place, choose free or paid, publish. Registrations, passes and the gate scanner are ready the moment it goes live.</p>
          <Link href="/organizer/events/new" className={buttonClass("primary", "lg", "mt-7")}>
            <Plus className="size-4" aria-hidden /> Create event
          </Link>
        </section>
      ) : (
        <>
          {drafts.length > 0 && (
            <Group title="Drafts" count={drafts.length}>
              {drafts.map((e) => (
                <EventRow key={e.id} e={e} draft />
              ))}
            </Group>
          )}
          <Group title="Upcoming" count={upcoming.length}>
            {upcoming.length === 0 ? <li className="px-5 py-6 text-small text-ink-muted">Nothing published yet.</li> : upcoming.map((e) => <EventRow key={e.id} e={e} />)}
          </Group>
          {past.length > 0 && (
            <Group title="Past" count={past.length}>
              {past.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  );
}
