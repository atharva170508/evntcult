import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { listEvents } from "@/lib/data/events";
import { CITIES, findCity, getTopicStats } from "@/lib/discovery";
import { EventArt } from "@/components/ui/EventArt";
import { EventCard } from "@/components/landing/EventCard";
import { SubscribeTopicButton } from "@/components/discovery/SubscribeTopicButton";
import { SubmitCityEventButton } from "@/components/discovery/SubmitCityEventButton";
import { LocalClock } from "@/components/discovery/LocalClock";
import { fmtDate } from "@/lib/utils";
import type { EventSummary } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = findCity(slug);
  return { title: city ? `${city.name} events` : "City" };
}

function groupByDay(events: EventSummary[]) {
  const map = new Map<string, { label: string; items: EventSummary[] }>();
  for (const e of events) {
    const key = fmtDate(e.startsAt, { year: "numeric", month: "2-digit", day: "2-digit" });
    const label = fmtDate(e.startsAt, { weekday: "long", day: "numeric", month: "long" });
    const bucket = map.get(key) ?? { label, items: [] };
    bucket.items.push(e);
    map.set(key, bucket);
  }
  return [...map.values()];
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = findCity(slug);
  if (!city) notFound();

  const [viewer, db, { events: allEvents }] = await Promise.all([
    getViewer(),
    getDB(),
    listEvents({}),
  ]);

  const stats = await getTopicStats(db, "city", city.slug, viewer?.id ?? null);

  const matched =
    city.matchTerms.length === 0
      ? allEvents
      : allEvents.filter((e) => {
          const hay = `${e.venueName ?? ""} ${e.title} ${e.tagline ?? ""}`.toLowerCase();
          return city.matchTerms.some((t) => hay.includes(t));
        });

  const displayEvents = matched.length > 0 ? matched : allEvents;
  const isShowingCampusFallback = matched.length === 0 && allEvents.length > 0;
  const groups = groupByDay(displayEvents);

  return (
    <div className="space-y-10 pb-12 pt-4">
      {/* Editorial city hero card */}
      <section className="overflow-hidden rounded-[24px] bg-surface shadow-card">
        <div className="relative h-44 overflow-hidden md:h-56">
          <EventArt accent={city.accent} seed={`city-${city.slug}`} scrim />
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-4 p-6 md:p-8">
            <h1 className="font-display text-[clamp(40px,5.5vw,68px)] leading-[0.95] tracking-[-0.03em] text-white">
              {city.name}
            </h1>
            <span className="paper-keep inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-sm">
              <span>{city.region}</span>
              <span aria-hidden className="text-line-strong">·</span>
              <LocalClock />
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center md:p-8">
          <p className="max-w-[56ch] text-[16px] leading-relaxed text-ink-2">
            {city.blurb}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <SubscribeTopicButton
              kind="city"
              slug={city.slug}
              initialSubscribed={stats.subscribed}
              initialCount={stats.count}
              signedIn={Boolean(viewer)}
            />
            <SubmitCityEventButton citySlug={city.slug} cityName={city.name} />
            <Link
              href="/venues"
              className="ui-press inline-flex h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-4 text-[14px] font-semibold text-ink hover:bg-sunken"
            >
              <MapPin className="size-4" aria-hidden /> Map
            </Link>
          </div>
        </div>
      </section>

      {/* Switcher strip for other hubs */}
      <nav aria-label="Other hubs" className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {CITIES.map((c) => (
          <Link
            key={c.slug}
            href={`/city/${c.slug}`}
            aria-current={c.slug === city.slug ? "page" : undefined}
            className={
              c.slug === city.slug
                ? "shrink-0 rounded-full bg-ink px-4 py-1.5 text-[13.5px] font-semibold text-white"
                : "shrink-0 rounded-full border border-line-strong bg-surface px-4 py-1.5 text-[13.5px] font-medium text-ink-2 hover:border-ink hover:text-ink"
            }
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {/* Day-grouped events */}
      {isShowingCampusFallback && (
        <p className="rounded-2xl border border-line bg-sunken/70 px-4 py-3 text-[14px] text-ink-2">
          No events tagged specifically for {city.name} yet. Showing upcoming open events across EvntCult, or use <strong>Submit event</strong> above to list yours.
        </p>
      )}

      {groups.length === 0 ? (
        <div className="rounded-[24px] border border-line-strong bg-surface p-10 text-center">
          <h2 className="font-display text-[36px] leading-tight text-ink">
            Quiet in {city.name} right now.
          </h2>
          <p className="mx-auto mt-2 max-w-[40ch] text-[15px] text-ink-muted">
            Subscribe to get notified when new events land, or submit one you&apos;re hosting.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.label} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-line pb-2.5">
                <h2 className="font-display text-[28px] leading-none text-ink">{g.label}</h2>
                <span className="font-mono text-[12px] text-ink-muted">
                  {g.items.length} event{g.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((e) => (
                  <li key={e.id}>
                    <EventCard e={e} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
