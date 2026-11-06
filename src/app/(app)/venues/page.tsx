import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin, MapPinOff, Navigation, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { VENUES, directionsUrl, type VenueInfo } from "@/lib/venues";
import { upcomingByVenue } from "@/lib/data/venue-schedule";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { Chip } from "@/components/ui/Chip";

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
  const mapped = venues.filter((v) => directionsUrl(v)).length;

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Venues"
        title={<>Find your <em>way</em></>}
        sub={`${venues.length} venues · ${mapped} with directions. Tap a venue's event to open it.`}
      />

      {mapped < venues.length && (
        <p className="rounded-2xl border border-dashed border-line-strong px-4 py-3 text-[13px] text-ink-muted">
          Some venues don&apos;t have a map location yet, so they show no Directions button. Organizers can add them in <code className="font-mono text-ink-2">src/lib/venues.ts</code>.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((v) => {
          const list = byVenue.get(v.name) ?? [];
          const url = directionsUrl(v);
          const live = list.find((e) => e.live);
          const highlighted = v.name === target;
          return (
            <article key={v.name} id={encodeURIComponent(v.name)} className={cn("card flex flex-col p-5", highlighted && "ring-2 ring-volt")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {highlighted && <p className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-volt">Your event is here</p>}
                  <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">{v.name}</h2>
                  <p className="mt-0.5 flex items-center gap-3 text-[12.5px] text-ink-muted">
                    {v.where && <span>{v.where}</span>}
                    {v.capacity > 0 && (
                      <span className="flex items-center gap-1"><Users className="size-3.5" aria-hidden /> <span className="font-mono tabular-nums">{v.capacity}</span> seats</span>
                    )}
                  </p>
                </div>
                {live && <Chip tone="volt" pulse>Live now</Chip>}
              </div>

              <ul className="mt-4 flex-1 space-y-1.5">
                {list.length === 0 && <li className="text-[13.5px] text-ink-muted">Nothing booked here yet.</li>}
                {list.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className={cn("group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5", e.slug === to && "bg-volt/10")}>
                      <span className="w-[88px] shrink-0 text-[12px] text-ink-muted">
                        {fmtDate(new Date(e.startsAt), { day: "numeric", month: "short" })} · {fmtTime(new Date(e.startsAt))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold group-hover:text-volt">{e.title}</span>
                      <ArrowUpRight className="size-3.5 text-ink-subtle" aria-hidden />
                    </Link>
                  </li>
                ))}
                {list.length > 3 && <li className="px-2 text-[12px] text-ink-muted">+{list.length - 3} more</li>}
              </ul>

              <div className="mt-4">
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-volt px-4 py-2.5 text-[13.5px] font-bold text-ink-inverse hover:bg-volt-hover">
                    <Navigation className="size-4" aria-hidden /> Directions <span className="sr-only">to {v.name} (opens Google Maps)</span>
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-2 text-[12.5px] text-ink-muted">
                    <MapPinOff className="size-4" aria-hidden /> Map location not added yet
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-[12.5px] text-ink-subtle">
        <MapPin className="size-3.5" aria-hidden /> Directions open Google Maps in a new tab.
      </p>
    </div>
  );
}
