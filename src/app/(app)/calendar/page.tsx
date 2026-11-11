import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { monthEvents, monthGrid, monthRange, type CalendarEvent } from "@/lib/data/calendar";
import { istYmd } from "@/lib/time";
import { cn, fmtTime } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventTone(e: CalendarEvent) {
  // §9 chips: going = solid, waitlist = dashed, hosting = outlined, everything else quiet. Words in the legend too.
  if (e.status === "cancelled") return "border-line text-ink-subtle line-through";
  if (e.mine === "registered") return "border-line-strong bg-surface-3 font-semibold text-ink";
  if (e.mine === "waitlisted") return "border-dashed border-line-strong text-ink";
  if (e.hosting) return "border-line-strong text-ink";
  return "border-transparent text-ink-muted";
}

function label(e: CalendarEvent) {
  if (e.status === "cancelled") return "Cancelled";
  if (e.status === "draft") return "Draft";
  if (e.mine === "registered") return "Going";
  if (e.mine === "waitlisted") return "Waitlist";
  if (e.hosting) return "Hosting";
  return null;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; view?: string }> }) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const range = monthRange(params.m);
  const onlyMine = !!viewer && params.view === "mine";
  const events = await monthEvents(await getDB(), { viewerId: viewer?.id ?? null, start: range.start, end: range.end, onlyMine });

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  const cells = monthGrid(range.year, range.month);
  const today = istYmd(new Date());
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(range.year, range.month, 1)));
  const href = (m: string, view = onlyMine ? "mine" : undefined) => `/calendar?m=${m}${view ? `&view=${view}` : ""}`;
  const thisMonth = monthRange(undefined).key;
  const navBtn = buttonClass("secondary", "sm");

  return (
    <div className="flex flex-col gap-8">
      <PageHero
        eyebrow="Calendar"
        title={<>{monthName.split(" ")[0]} {monthName.split(" ")[1]}</>}
        sub={`${events.length} event${events.length === 1 ? "" : "s"} ${onlyMine ? "you're going to or hosting" : "happening"} this month`}
        actions={
          <>
            <Link href={href(range.prev)} className={navBtn} aria-label="Previous month"><span aria-hidden>←</span> Prev</Link>
            {range.key !== thisMonth && <Link href={href(thisMonth)} className={navBtn}>Today</Link>}
            <Link href={href(range.next)} className={navBtn} aria-label="Next month">Next <span aria-hidden>›</span></Link>
          </>
        }
      />

      {viewer && (
        <nav aria-label="Which events" className="flex gap-2">
          {[
            { view: undefined, text: "All events" },
            { view: "mine", text: "Only mine" },
          ].map((t) => {
            const active = (t.view === "mine") === onlyMine;
            return (
              <Link
                key={t.text}
                href={href(range.key, t.view)}
                aria-current={active ? "page" : undefined}
                className={cn("press inline-flex h-8 items-center justify-center rounded-sm border px-3 text-label", active ? "border-line-strong bg-surface-2 font-semibold text-ink" : "border-line text-ink-muted hover:border-line-strong hover:text-ink")}
              >
                {t.text}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Month grid: continuous, square inside (§9). */}
      <section aria-label={`${monthName} month view`}>
        <div className="grid grid-cols-7 border-x border-t border-line">
          {WEEKDAYS.map((d) => (
            <div key={d} className="border-r border-line px-2 py-1 font-mono text-caption uppercase text-ink-subtle last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-line">
          {cells.map((day, i) => {
            if (!day) return <div key={`b${i}`} className="min-h-[52px] border-b border-r border-line bg-canvas md:min-h-[106px]" />;
            const list = byDay.get(day) ?? [];
            const isToday = day === today;
            return (
              <div key={day} className="min-h-[52px] min-w-0 border-b border-r border-line bg-surface p-1 md:min-h-[106px]">
                <p className={cn("grid size-6 place-items-center rounded-full font-mono text-caption tabular-nums", isToday ? "bg-accent text-accent-ink" : list.length ? "text-ink" : "text-ink-subtle")}>
                  {Number(day.slice(8))}
                  {isToday && <span className="sr-only"> (today)</span>}
                </p>
                {/* Phones: dots (filled = yours). Laptops: chips. */}
                {list.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 px-1 md:hidden" aria-label={`${list.length} event${list.length > 1 ? "s" : ""}`}>
                    {list.slice(0, 4).map((e) => (
                      <span key={e.id} className={cn("size-1.5 rounded-full", e.mine || e.hosting ? "bg-ink" : "border border-ink-subtle")} />
                    ))}
                  </div>
                )}
                <ul className="mt-1 hidden flex-col gap-0.5 md:flex">
                  {list.slice(0, 2).map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.slug}`} className={cn("flex h-[30px] flex-col justify-center overflow-hidden rounded-sm border px-1 hover:border-line-strong", eventTone(e))}>
                        <span className="font-mono text-caption leading-none text-ink-muted">{fmtTime(new Date(e.startsAt))}</span>
                        <span className="truncate text-caption leading-tight">{e.title}</span>
                      </Link>
                    </li>
                  ))}
                  {list.length > 2 && <li className="px-1 font-mono text-caption text-ink-muted">+{list.length - 2} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-caption text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-sm border border-line-strong bg-surface-3" /> Going
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-sm border border-dashed border-line-strong" /> Waitlist
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-sm border border-line-strong" /> Hosting
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-sm" /> Other events
          </span>
        </p>
      </section>

      {/* Agenda */}
      <section aria-labelledby="agenda-h">
        <h2 id="agenda-h" className="border-b border-line pb-3 text-heading">
          Agenda
        </h2>
        {events.length === 0 ? (
          <EmptyState
            title={onlyMine ? "Nothing of yours this month." : "No events this month."}
            body={onlyMine ? "Register for an event and it shows up here." : "Try the next month, or check back when organizers publish more."}
            action={{ label: "Discover events", href: "/events" }}
          />
        ) : (
          [...byDay.entries()].map(([day, list]) => (
            <div key={day} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 border-b border-line py-3 md:grid-cols-[120px_minmax(0,1fr)]">
              <div>
                <p className={cn("font-mono text-caption uppercase", day === today ? "text-ink" : "text-ink-subtle")}>
                  {new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}
                  {day === today && " · today"}
                </p>
                <p className="font-display text-heading">{Number(day.slice(8))}</p>
              </div>
              <ul className="min-w-0">
                {list.map((e) => (
                  <li key={e.id} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 py-1 md:grid-cols-[72px_minmax(0,1fr)_minmax(0,200px)_auto]">
                    <span className="font-mono text-label tabular-nums text-ink-muted">{fmtTime(new Date(e.startsAt))}</span>
                    <Link href={`/events/${e.slug}`} className={cn("min-w-0 min-h-6 truncate py-0.5 text-body font-semibold hover:underline", e.status === "cancelled" && "line-through opacity-60")}>
                      {e.title}
                    </Link>
                    <span className="col-start-2 truncate font-mono text-label text-ink-muted md:col-start-auto">{e.venue}</span>
                    {label(e) && <Chip tone={e.status === "cancelled" ? "danger" : "neutral"}>{label(e)}</Chip>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
