import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Navigation, Search, Smartphone } from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import type { KindCount, VenueCount } from "@/lib/data/landing";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { CountUp, Countdown } from "./Live";
import { seatState } from "./EventCard";

const cta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.97]";
const ghost =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[16px] font-semibold text-ink ring-1 ring-inset ring-line-strong transition-[background-color,transform,box-shadow] duration-fast hover:shadow-raised active:scale-[0.97]";

/* ── Ticker ─────────────────────────────────────────────── */

/** What's on next, gliding past. Pauses on hover; sits still under reduced motion. */
export function Ticker({ events }: { events: EventSummary[] }) {
  if (events.length < 3) return null;
  const now = new Date();
  const item = (e: EventSummary, k: string, copy = false) => {
    const live = seatState(e, now) === "live";
    return (
      <li key={k} aria-hidden={copy || undefined} className={copy ? "flex shrink-0 items-center motion-reduce:hidden" : "flex shrink-0 items-center"}>
        <Link href={`/events/${e.slug}`} tabIndex={copy ? -1 : undefined} className="group flex items-center gap-3 px-6 py-3.5 text-[14px] text-ink-2 transition-colors hover:text-ink">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-[11.5px] font-semibold text-white">
              <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden /> Live
            </span>
          ) : (
            <span className="tabular-nums font-semibold text-ink">
              {fmtDate(e.startsAt, { weekday: "short" })} {fmtTime(e.startsAt)}
            </span>
          )}
          <span className="font-medium group-hover:underline group-hover:underline-offset-4">{e.title}</span>
          <span className="text-ink-subtle">{e.venueName ?? ""}</span>
        </Link>
        <span aria-hidden className="size-1 rounded-full bg-line-strong" />
      </li>
    );
  };
  return (
    <section aria-label="Coming up" className="bleed group/ticker relative overflow-hidden border-y border-line bg-white/60">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />
      <ul className="flex w-max motion-safe:animate-[marquee_60s_linear_infinite] group-hover/ticker:[animation-play-state:paused] motion-reduce:w-full motion-reduce:overflow-x-auto">
        {events.map((e) => item(e, `a-${e.id}`))}
        {events.map((e) => item(e, `b-${e.id}`, true))}
      </ul>
    </section>
  );
}

/* ── Featured event ─────────────────────────────────────── */

export function Featured({ e }: { e: EventSummary }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const pct = e.capacity ? Math.min(100, Math.round((e.registered / e.capacity) * 100)) : null;
  return (
    <Reveal as="section" className="pt-10">
      <h2 className="sr-only">Featured event</h2>
      <Spotlight tone="light" className="overflow-hidden rounded-[28px] bg-white shadow-[0_0_0_1px_#DCD6C6,inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-36px_rgba(60,40,10,0.45)]">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <Link href={`/events/${e.slug}`} className="group relative block aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[420px]" aria-label={e.title}>
            <EventArt accent={e.accent} seed={e.id} scrim={false} className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
            <span className="absolute left-5 top-5 z-[2] rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-semibold text-ink shadow-[0_4px_12px_rgba(0,0,0,0.12)] backdrop-blur">
              {state === "live" ? "Happening now" : "Featured"}
            </span>
          </Link>
          <div className="relative z-[2] flex flex-col p-7 md:p-10">
            <p className="text-[14px] font-semibold text-ink-muted">{state === "live" ? "On right now" : "Starts in"}</p>
            <Countdown to={e.startsAt.toISOString()} end={e.endsAt.toISOString()} className="mt-1 font-display text-[44px] leading-none tracking-[-0.02em] text-ink md:text-[56px]" />
            <h3 className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[34px]">{e.title}</h3>
            {e.tagline && <p className="mt-2 max-w-[40ch] text-[16px] text-ink-2">{e.tagline}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-5 text-[14px]">
              <div>
                <dt className="text-ink-muted">When</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })}, {fmtTime(e.startsAt)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Where</dt>
                <dd className="mt-0.5 truncate font-semibold text-ink">{e.venueName ?? "Venue TBA"}</dd>
              </div>
            </dl>
            {pct !== null && (
              <div className="mt-5">
                <div className="flex justify-between text-[13.5px]">
                  <span className="font-semibold text-ink">{e.registered} going</span>
                  <span className="text-ink-muted">{left === 0 ? "Full" : `${left} seats left`}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                  <div className="h-full rounded-full bg-ink transition-[width] duration-slow" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
              <Magnetic>
                <Link href={`/events/${e.slug}#register`} className={cta}>
                  {e.feePaise ? `Register · ${formatINR(e.feePaise)}` : "Register · free"}
                </Link>
              </Magnetic>
              <Link href={`/events/${e.slug}`} className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Details
              </Link>
            </div>
          </div>
        </div>
      </Spotlight>
    </Reveal>
  );
}

/* ── How it works (a real sequence, so it's numbered) ───── */

export function HowItWorks() {
  const steps = [
    {
      n: "1",
      t: "Find it",
      b: "Search or browse what's on this week.",
      art: (
        <div className="flex h-11 w-full items-center gap-2 rounded-full border border-line-strong bg-white px-4 shadow-search">
          <Search className="size-4 text-ink" strokeWidth={2.4} aria-hidden />
          <span className="text-[13px] text-ink-2">hackathon</span>
          <span className="ml-auto grid size-7 place-items-center rounded-full bg-accent text-white">
            <Search className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
        </div>
      ),
    },
    {
      n: "2",
      t: "Get your pass",
      b: "Register in a tap. Your pass is ready instantly.",
      art: (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-line-strong bg-white p-3 shadow-search">
          <div className="grid size-12 shrink-0 grid-cols-4 gap-[2px] rounded-md bg-white p-1 ring-1 ring-line" aria-hidden>
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} className={[0, 1, 3, 4, 6, 9, 11, 12, 14, 15].includes(i) ? "bg-ink" : ""} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">Your pass</p>
            <p className="font-mono text-[12px] tracking-[0.1em] text-ink-muted">EC-HOOP-0042</p>
          </div>
        </div>
      ),
    },
    {
      n: "3",
      t: "Walk in",
      b: "Show it at the gate. Scanned, you're in.",
      art: (
        <div className="flex w-full items-center gap-2 rounded-2xl bg-[#E3F3EC] px-4 py-3.5 text-[14px] font-semibold text-live">
          <span className="grid size-7 place-items-center rounded-full bg-live text-white">
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </span>
          Admitted · 7:02 pm
        </div>
      ),
    },
  ];
  return (
    <section aria-labelledby="how-h" id="how" className="scroll-mt-28 py-20">
      <Reveal>
        <h2 id="how-h" className="font-display text-[clamp(40px,5vw,64px)] leading-none tracking-[-0.03em]">
          Three taps <em>to the door.</em>
        </h2>
      </Reveal>
      <StaggerGroup as="ol" className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <StaggerItem as="li" key={s.n}>
            <Spotlight tone="light" className="flex h-full flex-col rounded-[24px] bg-sunken p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="relative z-[2] flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{s.n}</span>
                <h3 className="text-[19px] font-semibold text-ink">{s.t}</h3>
              </div>
              <p className="relative z-[2] mt-2 text-[15px] text-ink-2">{s.b}</p>
              <div className="relative z-[2] mt-8 flex min-h-[72px] items-end">{s.art}</div>
            </Spotlight>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

/* ── Kinds bento ────────────────────────────────────────── */

export function KindBento({ kinds }: { kinds: KindCount[] }) {
  if (kinds.length < 3) return null;
  const tiles = kinds.slice(0, 5);
  return (
    <section aria-labelledby="kinds-h" className="py-10">
      <Reveal className="flex items-end justify-between gap-4">
        <h2 id="kinds-h" className="text-[22px] font-semibold tracking-[-0.01em] text-ink">
          Browse by kind
        </h2>
        <Link href="/events" className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          All events
        </Link>
      </Reveal>
      <StaggerGroup className="mt-5 grid auto-rows-[150px] grid-cols-2 gap-4 md:auto-rows-[180px] md:grid-cols-4">
        {tiles.map((k, i) => (
          <StaggerItem key={k.key} className={i === 0 ? "col-span-2 row-span-2" : i === 3 ? "col-span-2 md:col-span-1" : ""}>
            <Link href={`/events?type=${k.key}`} className="group block h-full">
              <Spotlight tone="light" className="h-full overflow-hidden rounded-[22px] transition-transform duration-slow ease-out group-hover:-translate-y-1">
                <EventArt accent={k.accent} seed={k.seed} scrim className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]" />
                <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between p-5 text-white">
                  <div>
                    <p className={i === 0 ? "font-display text-[44px] leading-none tracking-[-0.02em]" : "text-[20px] font-semibold"}>{k.title}</p>
                    <p className="mt-1 text-[14px] font-medium text-white/85">
                      {k.count} upcoming
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white/20 backdrop-blur transition-transform duration-base group-hover:rotate-45">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Spotlight>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

/* ── Venues ─────────────────────────────────────────────── */

export function Venues({ venues }: { venues: VenueCount[] }) {
  if (venues.length < 2) return null;
  return (
    <section aria-labelledby="venues-h" className="py-10">
      <Reveal className="flex items-end justify-between gap-4">
        <h2 id="venues-h" className="text-[22px] font-semibold tracking-[-0.01em] text-ink">
          Around campus
        </h2>
        <Link href="/venues" className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          All venues
        </Link>
      </Reveal>
      <StaggerGroup as="ul" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <StaggerItem as="li" key={v.name}>
            <Link href={`/venues?to=${encodeURIComponent(v.name)}`} className="group flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-[box-shadow,transform] duration-base hover:-translate-y-0.5 hover:shadow-raised">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                <EventArt accent={v.next.accent} seed={v.next.id} flat scrim={false} />
                <MapPin className="absolute inset-0 m-auto size-5 text-white" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold text-ink">{v.name}</span>
                <span className="block truncate text-[13.5px] text-ink-muted">
                  {v.count} upcoming · next {v.next.title}
                </span>
              </span>
              <Navigation className="size-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink" aria-hidden />
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

/* ── Numbers ────────────────────────────────────────────── */

export function Numbers({ upcoming, going, checkins }: { upcoming: number; going: number; checkins: number }) {
  const stats = [
    { n: upcoming, l: upcoming === 1 ? "event coming up" : "events coming up" },
    { n: going, l: going === 1 ? "person going" : "people going" },
    { n: checkins, l: checkins === 1 ? "scan at the gate" : "scans at the gate" },
  ].filter((s) => s.n > 0);
  if (stats.length < 2) return null;
  return (
    <Reveal as="section" className="my-10 grid gap-px overflow-hidden rounded-[24px] bg-line-strong sm:grid-cols-3">
      <h2 className="sr-only">EvntCult right now</h2>
      {stats.map((s) => (
        <div key={s.l} className="bg-white px-7 py-8">
          <CountUp value={s.n} className="block font-display text-[56px] leading-none tracking-[-0.03em] text-ink tabular-nums" />
          <p className="mt-2 text-[15px] text-ink-muted">{s.l}</p>
        </div>
      ))}
    </Reveal>
  );
}

/* ── App ────────────────────────────────────────────────── */

export function AppBand() {
  return (
    <Reveal as="section" className="my-16">
      <div className="grid items-center gap-10 overflow-hidden rounded-[28px] bg-lavender/60 px-7 pt-10 ring-1 ring-inset ring-[#E2C8F7] md:grid-cols-2 md:px-14 md:pt-0">
        <div className="md:py-14">
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
            Your pass, <em>on your home screen.</em>
          </h2>
          <ul className="mt-6 space-y-2 text-[16px] text-ink-2">
            <li>Opens straight to your passes</li>
            <li>Works without internet at the gate</li>
            <li>No app store needed</li>
          </ul>
          <Link href="/get-app" className={`${cta} mt-8`}>
            <Smartphone className="size-4" aria-hidden /> Install the app
          </Link>
        </div>
        <div className="flex justify-center self-end">
          <div className="w-[250px] translate-y-6 rounded-t-[40px] border-[10px] border-b-0 border-ink bg-white px-4 pb-10 pt-6 shadow-[0_30px_60px_-20px_rgba(60,20,90,0.45)] transition-transform duration-slow ease-out hover:translate-y-2">
            <div className="mx-auto h-1.5 w-16 rounded-full bg-ink/15" />
            <p className="mt-5 text-[12px] font-semibold text-ink-muted">Tonight</p>
            <p className="text-[17px] font-semibold leading-tight text-ink">Your next event</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line-strong">
              <div className="relative h-20">
                <EventArt accent="orange" seed="app-pass" scrim={false} />
              </div>
              <div className="flex items-center gap-3 p-3">
                <div className="grid size-14 grid-cols-5 gap-[2px] rounded-md p-1 ring-1 ring-line" aria-hidden>
                  {Array.from({ length: 25 }, (_, i) => (
                    <span key={i} className={(i * 3 + (i % 4)) % 2 === 0 ? "bg-ink" : ""} />
                  ))}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-ink">Pass</p>
                  <p className="font-mono text-[11px] tracking-[0.08em] text-ink-muted">EC-0042</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Closing ────────────────────────────────────────────── */

export function Closing() {
  return (
    <Reveal as="section" className="mb-6 mt-4 text-center">
      <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(44px,6vw,84px)] leading-[0.95] tracking-[-0.03em]">
        See you <em>at the gate.</em>
      </h2>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Magnetic>
          <Link href="/signin?mode=signup" className={cta}>
            Get your pass
          </Link>
        </Magnetic>
        <Link href="/events" className={ghost}>
          Browse events
        </Link>
      </div>
    </Reveal>
  );
}
