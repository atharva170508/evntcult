import { MonthSlide } from "@/components/calendar/MonthSlide";
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
import { SubscribeCalendar } from "@/components/calendar/SubscribeCalendar";
import { calendarFeedToken } from "@/lib/session";
import { siteHost } from "@/lib/organizer/page-data";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventTone(e: CalendarEvent) {
  if (e.status === "cancelled") return "bg-danger-soft text-danger line-through";
  if (e.mine === "registered") return "bg-[#D4B87A] text-[#161820] font-medium";
  if (e.mine === "waitlisted") return "bg-warn-soft text-warn";
  if (e.hosting) return "border border-[#D4B87A]/50 bg-accent-soft text-[#D4B87A]";
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
    <div className="space-y-10 pb-14">
      <PageHero
        title={monthName}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {feedUrl && <SubscribeCalendar feedUrl={feedUrl} />}
            <div className="flex items-center rounded-[4px] border border-line bg-surface p-0.5">
              <Link
                href={href(range.prev)}
                className="grid size-9 place-items-center text-ink-muted transition-colors hover:text-[#D4B87A]"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Link>
              <Link
                href={href(thisMonth)}
                className={cn(
                  "tr-meta inline-flex h-9 items-center px-3 text-ink transition-colors hover:text-[#D4B87A]",
                  range.key === thisMonth && "pointer-events-none opacity-40",
                )}
                aria-disabled={range.key === thisMonth || undefined}
              >
                Today
              </Link>
              <Link
                href={href(range.next)}
                className="grid size-9 place-items-center text-ink-muted transition-colors hover:text-[#D4B87A]"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        }
      />

      {viewer && (
        <nav aria-label="Filter events" className="inline-flex rounded-[4px] border border-line bg-surface p-1">
          {[
            { view: undefined, text: "All" },
            { view: "mine", text: "Mine" },
          ].map((t) => {
            const active = (t.view === "mine") === onlyMine;
            return (
              <Link
                key={t.text}
                href={href(range.key, t.view)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tr-meta rounded-[3px] px-4 py-2 transition-colors",
                  active ? "bg-[#D4B87A] text-[#161820]" : "text-ink-muted hover:text-ink",
                )}
              >
                {t.text}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Architectural hairline calendar grid */}
      <section
        className="overflow-hidden rounded-[6px] border border-line bg-surface"
        aria-label={`${monthName} month view`}
      >
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((d) => (
            <div key={d} className="tr-meta py-3 text-center text-ink-muted">
              {d}
            </div>
          ))}
        </div>

        <MonthSlide month={`${range.year}-${String(range.month + 1).padStart(2, "0")}`}>
          <div className="grid grid-cols-7 divide-x divide-y divide-line">
            {cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} className="min-h-[58px] bg-canvas/30 md:min-h-[112px]" />;
              const list = byDay.get(day) ?? [];
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={cn(
                    "relative min-h-[58px] p-1.5 transition-colors md:min-h-[112px] md:p-2.5",
                    isToday ? "bg-[#D4B87A]/[0.07]" : "hover:bg-sunken/60",
                  )}
                >
                  {list.length > 0 && (
                    <a
                      href={`#d-${day}`}
                      aria-label={`Go to ${Number(day.slice(8))} in the agenda`}
                      className="absolute inset-0 z-[1] md:hidden"
                    />
                  )}
                  <p
                    className={cn(
                      "mx-auto grid size-7 place-items-center rounded-full font-mono text-[12px] tabular-nums md:mx-0",
                      isToday ? "bg-[#D4B87A] font-medium text-[#161820]" : list.length ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {Number(day.slice(8))}
                    {isToday && <span className="sr-only"> (today)</span>}
                  </p>
                  {list.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-1 md:hidden">
                      {list.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className={cn("size-1.5 rounded-full", e.mine || e.hosting ? "bg-[#D4B87A]" : "bg-ink-muted")}
                        />
                      ))}
                    </div>
                  )}
                  <ul className="mt-2 hidden space-y-1 md:block">
                    {list.slice(0, 3).map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/events/${e.slug}`}
                          className={cn(
                            "block truncate rounded-[3px] px-1.5 py-1 text-[11.5px] leading-tight transition-opacity hover:opacity-85",
                            eventTone(e),
                          )}
                        >
                          <span className="font-mono tabular-nums opacity-75">{fmtTime(new Date(e.startsAt))}</span> {e.title}
                        </Link>
                      </li>
                    ))}
                    {list.length > 3 && <li className="px-1.5 font-mono text-[10.5px] text-ink-muted">+{list.length - 3}</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </MonthSlide>
      </section>

      {/* Hairline Agenda */}
      <section aria-labelledby="agenda-heading" className="space-y-4">
        <h2 id="agenda-heading" className="border-b border-line pb-3 font-display text-[clamp(28px,3.2vw,42px)] font-bold italic text-ink">
          Agenda
        </h2>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events this month"
            body=""
            action={{ label: "Explore events", href: "/events" }}
          />
        ) : (
          <div className="divide-y divide-line border-b border-line">
            {[...byDay.entries()].map(([day, list]) => (
              <div
                key={day}
                id={`d-${day}`}
                className="grid scroll-mt-[calc(var(--header-h)+16px)] gap-4 py-5 md:grid-cols-[120px_1fr]"
              >
                <div className="flex items-baseline gap-2 md:block">
                  <p className={cn("tr-meta", day === today ? "text-[#D4B87A]" : "text-ink-muted")}>
                    {new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}
                  </p>
                  <p className="font-display text-[36px] font-semibold italic leading-none tabular-nums text-ink">
                    {Number(day.slice(8))}
                  </p>
                </div>
                <ul className="min-w-0 divide-y divide-line">
                  {list.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 py-3 first:pt-0 last:pb-0">
                      <span className="w-[72px] shrink-0 font-mono text-[12px] tabular-nums text-ink-muted">
                        {fmtTime(new Date(e.startsAt))}
                      </span>
                      <Link
                        href={`/events/${e.slug}`}
                        className={cn(
                          "min-w-0 flex-1 truncate font-display text-[22px] font-semibold italic text-ink transition-colors hover:text-[#D4B87A]",
                          e.status === "cancelled" && "line-through opacity-55",
                        )}
                      >
                        {e.title}
                      </Link>
                      <span className="flex items-center gap-1 text-[13px] font-light text-ink-muted">
                        <MapPin className="size-3.5" aria-hidden /> {e.venue}
                      </span>
                      {label(e) && <span className="tr-meta text-[#D4B87A]">{label(e)}</span>}
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
