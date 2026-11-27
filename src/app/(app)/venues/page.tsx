import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPinOff, Navigation } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { VENUES, directionsUrl, type VenueInfo } from "@/lib/venues";
import { mapsUrl } from "@/lib/organizer/shared";
import { upcomingByVenue } from "@/lib/data/venue-schedule";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Venues" };
export const dynamic = "force-dynamic";

/** Full-width architectural venue directory rows with live status and directions. */
export default async function VenuesPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const [viewer, { to }] = await Promise.all([getViewer(), searchParams]);
  const byVenue = await upcomingByVenue(await getDB(), { viewerId: viewer?.id ?? null });

  let target: string | null = null;
  if (to) for (const [venue, list] of byVenue) if (list.some((e) => e.slug === to)) target = venue;

  const venues: VenueInfo[] = [...VENUES];
  for (const name of byVenue.keys()) if (!venues.some((v) => v.name === name)) venues.push({ name, capacity: 0, bufferMinutes: 30 });
  if (target) venues.sort((a, b) => Number(b.name === target) - Number(a.name === target));

  const liveCount = venues.filter((v) => (byVenue.get(v.name) ?? []).some((e) => e.live)).length;

  return (
    <div className="space-y-10 pb-16">
      <PageHero
        title={
          <>
            Event <span className="text-[#D4B87A]">Venues.</span>
          </>
        }
        actions={
          <div className="flex items-center gap-4">
            <span className="tr-meta text-ink-muted">{venues.length} spaces</span>
            {liveCount > 0 && (
              <span className="tr-meta inline-flex items-center gap-2 text-[#D4B87A]">
                <span className="size-1.5 rounded-full bg-[#D4B87A]" aria-hidden />
                {liveCount} live
              </span>
            )}
          </div>
        }
      />

      <div className="divide-y divide-line border-b border-line">
        {venues.map((v, idx) => {
          const list = byVenue.get(v.name) ?? [];
          const url = directionsUrl(v) ?? mapsUrl({ venue: v.name });
          const live = list.find((e) => e.live);
          const highlighted = v.name === target;

          return (
            <article
              key={v.name}
              id={encodeURIComponent(v.name)}
              className={cn(
                "grid grid-cols-1 gap-6 px-2 py-8 transition-colors hover:bg-surface md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] md:items-start md:gap-10 md:px-5",
                highlighted && "bg-surface",
              )}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {live && (
                    <span className="tr-meta inline-flex items-center gap-1.5 text-[#D4B87A]">
                      <span className="size-1.5 rounded-full bg-[#D4B87A]" aria-hidden />
                      Live
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-display text-[clamp(28px,3.2vw,40px)] font-semibold italic leading-tight text-ink">
                  {v.name}
                </h2>
                <p className="mt-1.5 text-[14px] font-light text-ink-muted">
                  {[v.where, v.capacity > 0 ? `${v.capacity} seats` : null].filter(Boolean).join(" · ")}
                </p>
              </div>

              <div>
                {list.length === 0 ? (
                  <p className="text-[14px] font-light text-ink-muted">No upcoming events scheduled.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {list.slice(0, 3).map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/events/${e.slug}`}
                          className="group flex items-center justify-between gap-4 py-2.5 first:pt-0"
                        >
                          <span className="min-w-0 truncate text-[15px] font-normal text-ink transition-colors group-hover:text-[#D4B87A]">
                            {e.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 font-mono text-[11.5px] tabular-nums text-ink-muted">
                            {fmtDate(new Date(e.startsAt), { day: "numeric", month: "short" })}, {fmtTime(new Date(e.startsAt))}
                            <ArrowUpRight className="size-3.5 text-[#D4B87A]" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center md:justify-end">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-line-strong px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
                  >
                    <Navigation className="size-3.5" aria-hidden />
                    <span>Directions</span>
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </a>
                ) : (
                  <span className="tr-meta inline-flex items-center gap-1.5 text-ink-muted">
                    <MapPinOff className="size-3.5" aria-hidden /> No map
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
