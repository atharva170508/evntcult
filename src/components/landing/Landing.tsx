import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import type { LandingData } from "@/lib/data/landing";
import { EventArt } from "@/components/ui/EventArt";
import { EventCard } from "./EventCard";
import { KindRail } from "./KindRail";
import { Row } from "./Row";

/** Browse homepage: categories, shelves of real events, and one way in for organizers. */
export function Landing({ data, signedIn = false, isOrganizer = false }: { data: LandingData; signedIn?: boolean; isOrganizer?: boolean }) {
  const hostHref = isOrganizer ? "/organizer" : signedIn ? "/organizer/events/new" : `/signin?next=${encodeURIComponent("/organizer/events/new")}`;

  return (
    <div className="pb-6">
      {/* Phones: the header has no room for the big bar, so search lives here. */}
      <form action="/events" method="get" role="search" className="pt-4 md:hidden">
        <label className="flex h-14 items-center gap-3 rounded-full border border-line-strong bg-white px-5 shadow-search">
          <Search className="size-5 shrink-0 text-ink" strokeWidth={2.4} aria-hidden />
          <input name="q" type="search" placeholder="Search events" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-ink [&::-webkit-search-cancel-button]:hidden" />
        </label>
      </form>

      <div className="border-b border-line">
        <Suspense>
          <KindRail />
        </Suspense>
      </div>

      <div className="pt-4">
        {data.rows.length === 0 ? (
          <p className="py-24 text-center text-[16px] text-ink-muted">No upcoming events yet.</p>
        ) : (
          data.rows.map((r) => (
            <Row key={r.key} title={r.title} href={r.href}>
              {r.events.map((e) => (
                <li key={e.id}>
                  <EventCard e={e} />
                </li>
              ))}
            </Row>
          ))
        )}
      </div>

      <section id="hosts" aria-labelledby="hosts-h" className="mt-12 scroll-mt-28">
        <div className="grid overflow-hidden rounded-[24px] bg-sunken md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-14">
            <h2 id="hosts-h" className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[40px]">
              Host your event on EvntCult
            </h2>
            <ul className="mt-6 space-y-2 text-[16px] text-ink-2">
              <li>Free or paid, with UPI</li>
              <li>Passes and a gate scanner</li>
              <li>Updates, photos and certificates</li>
            </ul>
            <Link href={hostHref} className="mt-8 inline-flex h-12 w-fit items-center rounded-lg bg-accent px-6 text-[16px] font-semibold text-white transition-colors hover:bg-accent-hover">
              {isOrganizer ? "Go to your events" : "Get started"}
            </Link>
          </div>
          <div className="relative min-h-[240px] md:min-h-[380px]">
            <EventArt accent="violet" seed="host-banner" scrim={false} />
          </div>
        </div>
      </section>
    </div>
  );
}
