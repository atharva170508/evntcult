import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { monthEvents, monthGrid, monthRange, type CalendarEvent } from "@/lib/data/calendar";
import { istYmd } from "@/lib/time";
import { cn, fmtTime } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventTone(e: CalendarEvent) {
  if (e.status === "cancelled") return "border-danger/40 bg-danger-soft text-danger line-through";
  if (e.mine === "registered") return "border-volt bg-volt text-ink-inverse";
  if (e.mine === "waitlisted") return "border-volt/60 bg-volt/10 text-volt";
  if (e.hosting) return "border-volt/40 bg-transparent text-ink";
  return "border-line bg-white/[0.04] text-ink-2";
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
  const navBtn = "glass inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-semibold hover:border-volt/60";

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Calendar"
        title={<>{monthName.split(" ")[0]} <em>{monthName.split(" ")[1]}</em></>}
        sub={`${events.length} event${events.length === 1 ? "" : "s"} ${onlyMine ? "you're going to or hosting" : "happening"} this month`}
        actions={
          <>
            <Link href={href(range.prev)} className={navBtn} aria-label="Previous month"><ChevronLeft className="size-4" aria-hidden /> Prev</Link>
            {range.key !== thisMonth && <Link href={href(thisMonth)} className={navBtn}>Today</Link>}
            <Link href={href(range.next)} className={navBtn} aria-label="Next month">Next <ChevronRight className="size-4" aria-hidden /></Link>
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
                className={cn("rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-colors", active ? "border-volt bg-volt text-ink-inverse" : "border-line bg-surface text-ink-2 hover:border-volt/60")}
              >
                {t.text}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Month grid */}
      <section className="card overflow-hidden p-3 md:p-4" aria-label={`${monthName} month view`}>
        <div className="grid grid-cols-7 gap-1.5 pb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-subtle">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`b${i}`} className="min-h-[52px] rounded-2xl md:min-h-[118px]" />;
            const list = byDay.get(day) ?? [];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={cn(
                  "min-h-[52px] rounded-2xl border p-1.5 md:min-h-[118px] md:p-2",
                  isToday ? "border-volt bg-volt/[0.06]" : "border-white/[0.06] bg-white/[0.02]",
                )}
              >
                <p className={cn("text-[12.5px] font-bold tabular-nums", isToday ? "text-volt" : list.length ? "text-ink" : "text-ink-subtle")}>
                  {Number(day.slice(8))}
                  {isToday && <span className="sr-only"> (today)</span>}
                </p>
                {/* Phones: dots. Laptops: event pills. */}
                {list.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 md:hidden" aria-label={`${list.length} event${list.length > 1 ? "s" : ""}`}>
                    {list.slice(0, 4).map((e) => (
                      <span key={e.id} className={cn("size-1.5 rounded-full", e.mine || e.hosting ? "bg-volt" : "bg-ink-subtle")} />
                    ))}
                  </div>
                )}
                <ul className="mt-1 hidden space-y-1 md:block">
                  {list.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.slug}`} className={cn("block truncate rounded-lg border px-1.5 py-1 text-[11.5px] font-semibold leading-tight transition-opacity hover:opacity-80", eventTone(e))}>
                        <span className="tabular-nums opacity-75">{fmtTime(new Date(e.startsAt))}</span> {e.title}
                      </Link>
                    </li>
                  ))}
                  {list.length > 3 && <li className="px-1 text-[11px] font-semibold text-ink-muted">+{list.length - 3} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[12px] text-ink-muted">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-volt" /> Going</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-volt/60 bg-volt/10" /> Waitlist</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-volt/40" /> Hosting</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-line bg-white/[0.04]" /> All events</span>
        </p>
      </section>

      {/* Agenda */}
      <section aria-label="Agenda" className="space-y-3">
        <h2 className="title-xl text-[32px]">Agenda</h2>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={onlyMine ? "Nothing of yours this month" : "No events this month"}
            body={onlyMine ? "Register for an event and it shows up here." : "Try the next month, or check back when organizers publish more."}
            action={{ label: "Discover events", href: "/events" }}
          />
        ) : (
          [...byDay.entries()].map(([day, list]) => (
            <div key={day} className="card flex flex-col gap-3 p-4 md:flex-row md:gap-6 md:p-5">
              <div className="w-28 shrink-0">
                <p className={cn("text-[13px] font-bold uppercase tracking-[0.08em]", day === today ? "text-volt" : "text-ink-subtle")}>
                  {new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}
                </p>
                <p className="font-display text-[34px] font-bold leading-none tracking-[-0.04em]">{Number(day.slice(8))}</p>
              </div>
              <ul className="min-w-0 flex-1 divide-y divide-line">
                {list.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                    <span className="w-[74px] shrink-0 font-mono text-[13px] tabular-nums text-ink-2">{fmtTime(new Date(e.startsAt))}</span>
                    <Link href={`/events/${e.slug}`} className={cn("min-w-0 flex-1 truncate text-[15px] font-semibold hover:text-volt", e.status === "cancelled" && "line-through opacity-60")}>
                      {e.title}
                    </Link>
                    <span className="flex items-center gap-1 text-[12.5px] text-ink-muted"><MapPin className="size-3.5" aria-hidden /> {e.venue}</span>
                    {label(e) && <Chip tone={e.mine === "registered" ? "volt" : e.status === "cancelled" ? "danger" : "outline"}>{label(e)}</Chip>}
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
