import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { VENUES, directionsUrl, type VenueInfo } from "@/lib/venues";
import { mapsUrl } from "@/lib/organizer/shared";
import { upcomingByVenue } from "@/lib/data/venue-schedule";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { Chip } from "@/components/ui/Chip";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Venues" };
export const dynamic = "force-dynamic";

/** Every venue with what's on there next, and directions where the location has been added. */
export default async function VenuesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const [viewer, { to }] = await Promise.all([getViewer(), searchParams]);
  const byVenue = await upcomingByVenue(await getDB(), { viewerId: viewer?.id ?? null });

  // "Directions" from an event opens this page with ?to=<event slug>: highlight that event's venue.
  let target: string | null = null;
  if (to) for (const [venue, list] of byVenue) if (list.some((e) => e.slug === to)) target = venue;

  // Known venues first (in the configured order), then any other venue an event uses.
  const venues: VenueInfo[] = [...VENUES];
  for (const name of byVenue.keys()) if (!venues.some((v) => v.name === name)) venues.push({ name, capacity: 0, bufferMinutes: 30 });
  if (target) venues.sort((a, b) => Number(b.name === target) - Number(a.name === target));

  return (
    <div className="flex flex-col gap-8">
      <PageHero eyebrow="Venues" title="Find your way" sub={`${venues.length} venues`} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((v) => {
          const list = byVenue.get(v.name) ?? [];
          const url = directionsUrl(v) ?? mapsUrl({ venue: v.name });
          const live = list.find((e) => e.live);
          const highlighted = v.name === target;
          return (
            <article key={v.name} id={encodeURIComponent(v.name)} className={cn("card flex min-w-0 flex-col p-4 sm:p-6", highlighted && "border-line-strong")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {highlighted && <p className="eyebrow mb-1 text-ink">Your event is here</p>}
                  <h2 className="text-title">{v.name}</h2>
                  <p className="mt-1 flex items-center gap-3 font-mono text-label text-ink-muted">
                    {v.where && <span>{v.where}</span>}
                    {v.capacity > 0 && (
                      <span className="tabular-nums">{v.capacity} seats</span>
                    )}
                  </p>
                </div>
                {live && (
                  <Chip tone="live" pulse>
                    Live now
                  </Chip>
                )}
              </div>

              <ul className="mt-4 flex-1 border-t border-line">
                {list.length === 0 && <li className="text-body-sm text-ink-muted">Nothing booked here yet.</li>}
                {list.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className={cn("grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-2 hover:bg-white/[0.03]", e.slug === to && "font-semibold")}>
                      <span className="font-mono text-caption text-ink-muted">
                        {fmtDate(new Date(e.startsAt), { day: "numeric", month: "short" })} · {fmtTime(new Date(e.startsAt))}
                      </span>
                      <span className="min-w-0 truncate text-body-sm">{e.title}</span>
                      <span aria-hidden className="text-ink-subtle">
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
                {list.length > 3 && <li className="py-2 font-mono text-caption text-ink-muted">+{list.length - 3} more</li>}
              </ul>

              <div className="mt-4">
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                    Directions › <span className="sr-only">to {v.name} (opens Google Maps)</span>
                  </a>
                ) : (
                  <p className="text-label text-ink-muted">
                    Map location not added yet
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
