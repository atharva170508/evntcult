import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import {
  monthEvents,
  monthGrid,
  monthRange,
  type CalendarEvent,
} from "@/lib/data/calendar";
import { istYmd } from "@/lib/time";
import { cn, fmtTime } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";
import { buttonClass } from "@/components/ui/Button";
import { SubscribeCalendar } from "@/components/calendar/SubscribeCalendar";
import { calendarFeedToken } from "@/lib/session";
import { siteHost } from "@/lib/organizer/page-data";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventTone(e: CalendarEvent) {
  if (e.status === "cancelled")
    return "bg-danger-soft text-danger line-through";
  if (e.mine === "registered") return "bg-night text-white";
  if (e.mine === "waitlisted") return "bg-warn-soft text-warn";
  if (e.hosting) return "bg-accent-soft text-accent-ink";
  return "bg-sunken text-ink-2";
}

function label(e: CalendarEvent) {
  if (e.status === "cancelled") return "Cancelled";
  if (e.status === "draft") return "Draft";
  if (e.mine === "registered") return "Going";
  if (e.mine === "waitlisted") return "Waitlist";
  if (e.hosting) return "Hosting";
  return null;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; view?: string }>;
}) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const range = monthRange(params.m);
  const onlyMine = !!viewer && params.view === "mine";
  const events = await monthEvents(await getDB(), {
    viewerId: viewer?.id ?? null,
    start: range.start,
    end: range.end,
    onlyMine,
  });

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  const cells = monthGrid(range.year, range.month);
  const today = istYmd(new Date());
  const monthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(range.year, range.month, 1)));
  const href = (m: string, view = onlyMine ? "mine" : undefined) =>
    `/calendar?m=${m}${view ? `&view=${view}` : ""}`;
  const thisMonth = monthRange(undefined).key;
  const host = await siteHost();
  const feedUrl = viewer
    ? `${host.startsWith("localhost") ? "http" : "https"}://${host}/api/calendar/${await calendarFeedToken(viewer.id)}.ics`
    : null;

  return (
    <div className="space-y-10 pb-8">
      <PageHero
        title={monthName}
        sub={
          <>
            {events.length} event{events.length === 1 ? "" : "s"}
            {onlyMine ? " you're in" : ""}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {feedUrl && <SubscribeCalendar feedUrl={feedUrl} />}
            <div className="flex items-center gap-1 rounded-full border border-line-strong bg-white p-1">
              <Link
                href={href(range.prev)}
                className={buttonClass("ghost", "sm", "w-8 px-0")}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Link>
              <Link
                href={href(thisMonth)}
                className={buttonClass("ghost", "sm")}
                aria-disabled={range.key === thisMonth || undefined}
              >
                Today
              </Link>
              <Link
                href={href(range.next)}
                className={buttonClass("ghost", "sm", "w-8 px-0")}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        }
      />

      {viewer && (
        <nav
          aria-label="Which events"
          className="inline-flex rounded-full bg-sunken p-1"
        >
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
                className={cn(
                  "rounded-xl px-4 py-1.5 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-fast",
                  active
                    ? "bg-surface text-ink shadow-card"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {t.text}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Month grid */}
      <section
        className="card overflow-hidden"
        aria-label={`${monthName} month view`}
      >
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-3 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-line">
          {cells.map((day, i) => {
            if (!day)
              return (
                <div
                  key={`b${i}`}
                  className="min-h-[56px] bg-canvas/60 md:min-h-[124px]"
                />
              );
            const list = byDay.get(day) ?? [];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={cn(
                  "min-h-[56px] bg-surface p-1.5 md:min-h-[124px] md:p-2",
                  isToday && "bg-accent-soft/40",
                )}
              >
                <p
                  className={cn(
                    "grid size-6 place-items-center rounded-full font-mono text-[12px] tabular-nums",
                    isToday
                      ? "bg-night font-medium text-white"
                      : list.length
                        ? "font-medium text-ink"
                        : "text-ink-subtle",
                  )}
                >
                  {Number(day.slice(8))}
                  {isToday && <span className="sr-only"> (today)</span>}
                </p>
                {/* Phones: dots. Laptops: event pills. */}
                {list.length > 0 && (
                  <div
                    className="mt-1 flex flex-wrap gap-1 px-0.5 md:hidden"
                    aria-label={`${list.length} event${list.length > 1 ? "s" : ""}`}
                  >
                    {list.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          e.mine || e.hosting ? "bg-accent" : "bg-ink-subtle",
                        )}
                      />
                    ))}
                  </div>
                )}
                <ul className="mt-1.5 hidden space-y-1 md:block">
                  {list.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.slug}`}
                        className={cn(
                          "block truncate rounded-md px-1.5 py-1 text-[11.5px] font-medium leading-tight transition-opacity duration-fast hover:opacity-80",
                          eventTone(e),
                        )}
                      >
                        <span className="font-mono tabular-nums opacity-70">
                          {fmtTime(new Date(e.startsAt))}
                        </span>{" "}
                        {e.title}
                      </Link>
                    </li>
                  ))}
                  {list.length > 3 && (
                    <li className="px-1.5 text-[11px] text-ink-muted">
                      +{list.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line px-4 py-3 text-[12px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-night" /> Going
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-warn-soft ring-1 ring-inset ring-warn/30" />{" "}
            Waitlist
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-accent-soft ring-1 ring-inset ring-accent/30" />{" "}
            Hosting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-sunken ring-1 ring-inset ring-line-strong" />{" "}
            All events
          </span>
        </p>
      </section>

      {/* Agenda */}
      <section aria-labelledby="agenda-heading" className="space-y-5">
        <h2 id="agenda-heading" className="text-display-md font-semibold">
          Agenda
        </h2>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={
              onlyMine ? "Nothing of yours this month" : "No events this month"
            }
            body={
              onlyMine
                ? "Register for an event and it shows up here."
                : "Try the next month, or check back when organizers publish more."
            }
            action={{ label: "Discover events", href: "/events" }}
          />
        ) : (
          <div className="card divide-y divide-line">
            {[...byDay.entries()].map(([day, list]) => (
              <div
                key={day}
                className="grid gap-3 p-4 md:grid-cols-[112px_1fr] md:gap-6 md:p-5"
              >
                <div className="flex items-baseline gap-2 md:block">
                  <p
                    className={cn(
                      "font-mono text-[11px] uppercase tracking-[0.08em]",
                      day === today ? "text-accent-ink" : "text-ink-subtle",
                    )}
                  >
                    {new Intl.DateTimeFormat("en-IN", {
                      weekday: "short",
                      timeZone: "UTC",
                    }).format(new Date(`${day}T00:00:00Z`))}
                    {day === today && " · Today"}
                  </p>
                  <p className="text-[32px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                    {Number(day.slice(8))}
                  </p>
                </div>
                <ul className="min-w-0 divide-y divide-line">
                  {list.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span className="w-[76px] shrink-0 font-mono text-[13px] tabular-nums text-ink-muted">
                        {fmtTime(new Date(e.startsAt))}
                      </span>
                      <Link
                        href={`/events/${e.slug}`}
                        className={cn(
                          "min-w-0 flex-1 truncate text-[15px] font-medium hover:underline hover:decoration-line-strong hover:underline-offset-4",
                          e.status === "cancelled" && "line-through opacity-60",
                        )}
                      >
                        {e.title}
                      </Link>
                      <span className="flex items-center gap-1 text-[12.5px] text-ink-muted">
                        <MapPin className="size-3.5" aria-hidden /> {e.venue}
                      </span>
                      {label(e) && (
                        <Chip
                          tone={
                            e.mine === "registered"
                              ? "dark"
                              : e.status === "cancelled"
                                ? "danger"
                                : e.hosting
                                  ? "accent"
                                  : "outline"
                          }
                        >
                          {label(e)}
                        </Chip>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
