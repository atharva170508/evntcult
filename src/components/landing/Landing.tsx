import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingData } from "@/lib/data/landing";
import { Departures } from "./Departures";
import { EventCard } from "./EventCard";
import { HeroSearch } from "./HeroSearch";
import { Closing, Evening, Hosts, KindRail, PassBand } from "./Sections";

const nf = new Intl.NumberFormat("en-IN");

/** The signed-out homepage. Every number and event on it is live. */
export function Landing({ data, qr }: { data: LandingData; qr: string }) {
  const liveNow = data.departures.filter((e) => +e.startsAt <= Date.now() && Date.now() < +e.endsAt).length;
  const stats = [
    { n: data.upcoming, label: data.upcoming === 1 ? "event coming up" : "events coming up" },
    { n: data.going, label: data.going === 1 ? "person going" : "people going" },
    { n: data.checkins, label: data.checkins === 1 ? "scan at the gate so far" : "scans at the gate so far" },
  ].filter((s) => s.n > 0);

  return (
    <div className="pb-4">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section aria-labelledby="hero-h" className="grid items-center gap-12 pb-14 pt-8 md:pt-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pb-20 lg:pt-16">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-lg bg-sunken px-2.5 py-1.5 text-[13px] font-semibold text-ink-2 motion-safe:animate-rise">
            {liveNow > 0 ? (
              <>
                <span className="size-1.5 rounded-full bg-live-dot motion-safe:animate-pulse-dot" aria-hidden />
                {liveNow} happening right now
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                {data.thisWeek > 0 ? `${data.thisWeek} ${data.thisWeek === 1 ? "event" : "events"} this week` : "New events every week"}
              </>
            )}
          </p>
          <h1 id="hero-h" className="mt-6 max-w-[13ch] text-display-xl font-medium motion-safe:animate-rise [animation-delay:60ms]">
            Everything happening on campus, in one pass.
          </h1>
          <p className="mt-6 max-w-[46ch] text-lead text-ink-muted motion-safe:animate-rise [animation-delay:120ms]">
            Find what&apos;s on tonight, register in a tap, and walk in with a scan. The photos and your certificate are waiting after.
          </p>
          <div className="mt-9 motion-safe:animate-rise [animation-delay:180ms]">
            <HeroSearch />
          </div>
        </div>
        <div className="min-w-0 motion-safe:animate-rise [animation-delay:240ms]">
          <Departures events={data.departures} />
        </div>
      </section>

      <div className="border-y border-line py-2">
        <KindRail />
      </div>

      {/* ── Popular ──────────────────────────────────────── */}
      {data.popular.length > 0 && (
        <section aria-labelledby="popular-h" className="pt-16 md:pt-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 id="popular-h" className="text-display-md font-medium">
                People are going to these
              </h2>
              <p className="mt-2 text-[15px] text-ink-muted">Upcoming events with the most registrations.</p>
            </div>
            <Link href="/events" className="group hidden shrink-0 items-center gap-1.5 text-[15px] font-semibold text-ink sm:inline-flex">
              See all <ArrowRight className="size-4 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <ul className="no-scrollbar -mx-gutter mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4 sm:[&>li:nth-child(n+5)]:hidden">
            {data.popular.map((e, i) => (
              <li key={e.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <EventCard e={e} priority={i < 4} />
              </li>
            ))}
          </ul>
          <Link href="/events" className="mt-8 flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold ring-1 ring-inset ring-line-strong sm:hidden">
            See all events
          </Link>
        </section>
      )}

      <div className="mt-section">
        <PassBand qr={qr} />
      </div>

      <div className="mt-section">
        <Evening />
      </div>

      <div className="mt-section border-t border-line pt-section">
        <Hosts signedIn={false} />
      </div>

      {stats.length > 0 && (
        <section aria-label="EvntCult in numbers" className="mt-section grid gap-8 border-y border-line py-12 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-[clamp(44px,5vw,64px)] font-medium leading-none tracking-[-0.03em]">{nf.format(s.n)}</p>
              <p className="mt-3 text-[15px] text-ink-muted">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      <div className="mt-section">
        <Closing signedIn={false} />
      </div>
    </div>
  );
}
