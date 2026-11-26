import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, LayoutGrid, List, Search, X } from "lucide-react";
import { listEvents } from "@/lib/data/events";
import { listQuerySchema } from "@/lib/validation";
import { EventCard } from "@/components/landing/EventCard";
import { KindRail } from "@/components/landing/KindRail";
import { CATEGORY_NAMES } from "@/components/site/categories";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { EventTimeline } from "@/components/events/EventTimeline";
import { EventPeek } from "@/components/events/EventPeek";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { CATEGORY_HUBS, getCategoryEventCounts } from "@/lib/discovery";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { formatINR } from "@/lib/money";
import { CinemaHeadline, CinemaReveal, CinemaSpotlightFrame } from "@/components/motion/CinemaReveal";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

const WHEN: Record<string, string> = {
  today: "Today",
  weekend: "This weekend",
  week: "This week",
  month: "This month",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const isOrganizer = (await getViewer())?.verifiedOrganizer ?? false;
  const parsed = listQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).filter(([, v]) => v)));
  const q = parsed.success ? parsed.data : {};
  const [{ events, nextCursor }, catCounts] = await Promise.all([
    listEvents(q),
    getCategoryEventCounts(await getDB()),
  ]);
  const view = raw.view === "list" ? "list" : "grid";

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = {
      type: q.type,
      when: q.when,
      price: q.price,
      q: q.q,
      view: view === "list" ? "list" : undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/events?${s}` : "/events";
  };

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-semibold backdrop-blur-md transition-colors duration-fast",
      active
        ? "border-ink bg-ink text-[#FFFEF6] dark:border-[#F0D7FF] dark:bg-[#F0D7FF] dark:text-[#121110]"
        : "border-line-strong bg-surface/85 text-ink-2 hover:border-ink hover:text-ink dark:border-white/12 dark:bg-[#1A1816]/75 dark:hover:border-white/30",
    );

  const nextHref = nextCursor
    ? `${href({})}${href({}).includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}`
    : null;

  const hasFilters = !!(q.type || q.when || q.price || q.q);
  const titleParts = [
    q.price === "free" ? "Free" : q.price === "paid" ? "Paid" : null,
    q.type ? CATEGORY_NAMES[q.type] : null,
    q.when ? WHEN[q.when].toLowerCase() : null,
  ].filter(Boolean);

  const spotlight = !hasFilters && view === "grid" && events.length >= 2 ? events[0] : null;
  const gridEvents = spotlight ? events.slice(1) : events;

  return (
    <div className="pb-12">
      {/* Editorial Discovery Masthead */}
      <header className="flex flex-col gap-5 pb-6 pt-8 md:flex-row md:items-end md:justify-between md:pt-10">
        <div>
          <CinemaHeadline>
            <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
              {hasFilters && titleParts.length > 0 ? (
                <>
                  {titleParts.join(" ")} <em>events.</em>
                </>
              ) : (
                <>
                  What&apos;s on <em>across campus.</em>
                </>
              )}
            </h1>
          </CinemaHeadline>
          <p className="mt-2.5 text-[15px] text-ink-muted" role="status">
            {events.length === 0
              ? "No events match your current filters."
              : `${events.length}${nextCursor ? "+" : ""} upcoming event${events.length === 1 ? "" : "s"} open for registration`}
          </p>
        </div>

        {/* Inline instant search bar */}
        <form action="/events" method="get" className="flex w-full items-center gap-2 md:w-auto">
          {q.type && <input type="hidden" name="type" value={q.type} />}
          {q.when && <input type="hidden" name="when" value={q.when} />}
          {q.price && <input type="hidden" name="price" value={q.price} />}
          {view === "list" && <input type="hidden" name="view" value="list" />}
          <div className="relative flex-1 md:w-[270px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q.q ?? ""}
              placeholder="Search events, clubs, venues…"
              className="h-11 w-full rounded-full border border-line-strong bg-surface/85 pl-10 pr-4 text-[14px] text-ink backdrop-blur-md placeholder:text-ink-subtle focus:border-ink focus:outline-none dark:border-white/12 dark:bg-[#1A1816]/80"
            />
          </div>
        </form>
      </header>

      {/* Category Icon Rail */}
      <div className="border-y border-line">
        <Suspense>
          <KindRail />
        </Suspense>
      </div>

      {/* Filter Pills + View Switch */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(WHEN).map(([k, v]) => (
            <Link key={k} href={href({ when: q.when === k ? undefined : k })} className={chip(q.when === k)}>
              {v}
            </Link>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-line-strong sm:inline-block" aria-hidden />
          <Link href={href({ price: q.price === "free" ? undefined : "free" })} className={chip(q.price === "free")}>
            Free
          </Link>
          <Link href={href({ price: q.price === "paid" ? undefined : "paid" })} className={chip(q.price === "paid")}>
            Paid
          </Link>
          {q.q && (
            <Link href={href({ q: undefined })} className={chip(true)}>
              &ldquo;{q.q}&rdquo; <X className="size-3.5" aria-hidden />
            </Link>
          )}
          {hasFilters && (
            <Link
              href="/events"
              className="ml-1 text-[13.5px] font-semibold text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
            >
              Reset
            </Link>
          )}
        </div>

        {events.length > 0 && (
          <div role="group" aria-label="Layout" className="inline-flex shrink-0 rounded-full bg-sunken p-1">
            {[
              { v: "grid", label: "Grid", Icon: LayoutGrid },
              { v: "list", label: "List", Icon: List },
            ].map(({ v, label, Icon }) => (
              <Link
                key={v}
                href={href({ view: v === "list" ? "list" : undefined })}
                aria-label={`${label} view`}
                aria-current={view === v ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-fast",
                  view === v ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Featured Spotlight Card (when browsing unfiltered grid) */}
      {spotlight && (
        <CinemaSpotlightFrame className="mt-7 bg-surface/90">
        <Link
          href={`/events/${spotlight.slug}`}
          className="group grid md:grid-cols-[1.1fr_1fr]"
        >
          <div className="relative min-h-[220px] overflow-hidden md:min-h-[290px]" style={{ background: accentHex(spotlight.accent) }}>
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]">
              {spotlight.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={spotlight.bannerUrl} alt="" className="size-full object-cover" />
              ) : (
                <EventArt accent={spotlight.accent} seed={spotlight.id} scrim={false} />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink-muted">
                <span>Featured next up</span>
                <span className="font-mono text-ink">
                  {spotlight.feePaise > 0 ? formatINR(spotlight.feePaise) : "Free"}
                </span>
              </div>
              <h2 className="mt-2 font-display text-[clamp(30px,3.2vw,44px)] leading-[0.98] tracking-[-0.025em] text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                {spotlight.title}
              </h2>
              <p className="mt-3 text-[14.5px] text-ink-2">
                {fmtDate(spotlight.startsAt, { weekday: "long", day: "numeric", month: "short" })} · {fmtTime(spotlight.startsAt)}
                {spotlight.venueName ? ` · ${spotlight.venueName}` : ""}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[14px] font-semibold text-ink">
              <span>{spotlight.registered > 0 ? `${spotlight.registered.toLocaleString("en-IN")} going` : "Open for registration"}</span>
              <span className="inline-flex items-center gap-1">
                View event <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </div>
        </Link>
        </CinemaSpotlightFrame>
      )}

      {/* Results Grid / List / Editorial Empty State */}
      {events.length === 0 ? (
        <div className="mt-8 rounded-[26px] border border-line-strong bg-sunken/70 p-8 text-center sm:p-12">
          <p className="font-display text-[32px] leading-tight tracking-[-0.02em] text-ink">
            {hasFilters ? "Nothing matches those filters yet." : "The campus board is clear."}
          </p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-ink-muted">
            {hasFilters
              ? "Try clearing a filter or exploring another category below."
              : "New events appear here the moment a club publishes them."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasFilters && (
              <Link
                href="/events"
                className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-[14.5px] font-semibold text-[#FFFEF6] transition-opacity hover:opacity-90"
              >
                Show all events
              </Link>
            )}
            {/* Organizers create; students can only apply to host. */}
            <Link
              href={isOrganizer ? "/organizer/events/new" : "/host"}
              className="inline-flex h-11 items-center rounded-xl bg-lavender px-5 text-[14.5px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover"
            >
              {isOrganizer ? "Create an event" : "Apply to host"}
            </Link>
          </div>
        </div>
      ) : (
        <EventPeek events={gridEvents}>
          {view === "list" ? (
            <div className="mt-6">
              <EventTimeline events={events} />
            </div>
          ) : (
            <ul className="mt-7 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
              {gridEvents.map((e, i) => (
                <li key={e.id} data-peek={e.slug}>
                  <CinemaReveal delay={Math.min(i, 7) * 0.04} y={16}>
                    <EventCard e={e} rows />
                  </CinemaReveal>
                </li>
              ))}
            </ul>
          )}
        </EventPeek>
      )}

      {nextHref && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <Link
            href={nextHref}
            className="inline-flex h-12 items-center rounded-xl bg-ink px-7 text-[15px] font-semibold text-[#FFFEF6] transition-opacity hover:opacity-90"
          >
            Load more events
          </Link>
        </div>
      )}

      {/* Category directory with live counts */}
      <section aria-labelledby="discover-hubs-h" className="mt-16 border-t border-line pt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="discover-hubs-h" className="font-display text-[32px] leading-none tracking-[-0.02em] text-ink">
            Browse by category
          </h2>
          <Link href="/calendar" className="text-[14px] font-semibold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
            Open monthly calendar
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_HUBS.map((c) => {
            const n = catCounts[c.code] ?? 0;
            return (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-line-strong bg-surface/85 p-4 shadow-card backdrop-blur-md transition-[transform,box-shadow,border-color] duration-fast hover:-translate-y-0.5 hover:shadow-raised dark:border-white/12 dark:bg-[#1A1816]/75 dark:hover:border-white/25"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[15px] font-semibold text-ink">{c.name}</span>
                    <ArrowUpRight className="size-4 text-ink-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                  </div>
                  <span className="mt-2 font-mono text-[12px] tabular-nums text-ink-muted">
                    {n} upcoming
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
