import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPinOff, Navigation, Users } from "lucide-react";
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

/** Every campus venue with what's on there next, and directions where the location has been added. */
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
    <div className="space-y-8 pb-8">
      <PageHero
        eyebrow="Venues"
        title={
          <>
            Find your <em>way.</em>
          </>
        }
        sub={
          <>
            <span className="font-mono tabular-nums text-ink">{venues.length}</span> venues
          </>
        }
      />


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((v) => {
          const list = byVenue.get(v.name) ?? [];
          const url = directionsUrl(v) ?? mapsUrl({ venue: v.name });
          const live = list.find((e) => e.live);
          const highlighted = v.name === target;
          return (
            <article key={v.name} id={encodeURIComponent(v.name)} className={cn("card flex flex-col p-5 md:p-6", highlighted && "ring-2 ring-ink ring-offset-2 ring-offset-canvas")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {highlighted && <p className="eyebrow mb-1.5 text-accent-ink">Your event is here</p>}
                  <h2 className="text-h3 font-semibold">{v.name}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
                    {v.where && <span>{v.where}</span>}
                    {v.capacity > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden /> <span className="font-mono tabular-nums">{v.capacity}</span> seats
                      </span>
                    )}
                  </p>
                </div>
                {live && (
                  <Chip tone="accent" pulse>
                    Live now
                  </Chip>
                )}
              </div>

              <div className="mt-5 flex-1 border-t border-line pt-4">
                <p className="eyebrow mb-2">Up next</p>
                <ul className="-mx-2 space-y-0.5">
                  {list.length === 0 && <li className="px-2 py-1.5 text-[13.5px] text-ink-muted">Nothing booked here yet.</li>}
                  {list.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.slug}`}
                        className={cn("group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-fast hover:bg-sunken/70", e.slug === to && "bg-accent-soft/60")}
                      >
                        <span className="w-[92px] shrink-0 font-mono text-[11.5px] uppercase tracking-[0.02em] text-ink-muted">
                          {fmtDate(new Date(e.startsAt), { day: "numeric", month: "short" })} · {fmtTime(new Date(e.startsAt))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{e.title}</span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                      </Link>
                    </li>
                  ))}
                  {list.length > 3 && <li className="px-2 pt-1 text-[12px] text-ink-muted">+{list.length - 3} more</li>}
                </ul>
              </div>

              <div className="mt-5">
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className={buttonClass(highlighted ? "primary" : "secondary", "md")}>
                    <Navigation className="size-4" aria-hidden /> Directions <span className="sr-only">to {v.name} (opens Google Maps)</span>
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-2 text-[12.5px] text-ink-subtle">
                    <MapPinOff className="size-4" aria-hidden /> Map location not added yet
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
