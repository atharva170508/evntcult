import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Navigation, Search, Smartphone } from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import type { KindCount, VenueCount } from "@/lib/data/landing";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Entrance, MaskedLines } from "@/components/motion/MaskedLines";
import { Spotlight } from "@/components/motion/Spotlight";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { CountUp, Countdown } from "./Live";
import { seatState } from "./EventCard";

const cta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.97]";
/* ── Hero: split, text left, the real "up next" list right (antislop layouts §17a) ── */

/**
 * The visitor's first screen, about EvntCult as a whole: every campus event in one place, one
 * calendar, live updates. Left: the line, Sign up, a link to this month. Right: the product itself —
 * the next events on campus, or the most recent ones when nothing is scheduled.
 */
export function Hero({ upNext, recent }: { upNext: EventSummary[]; recent: EventSummary[] }) {
  const list = (upNext.length ? upNext : recent).slice(0, 4);
  const now = new Date();
  return (
    <section aria-labelledby="hero-h" className="grid items-center gap-12 pb-12 pt-10 md:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-20 lg:pt-20">
      <div>
        <h1 id="hero-h" className="font-display text-[clamp(56px,8.5vw,108px)] leading-[0.92] tracking-[-0.035em] text-ink">
          <MaskedLines lines={["Every campus event,", <em key="l2">in one place.</em>]} />
        </h1>
        <Entrance delay={0.3}>
          <p className="mt-7 max-w-[34ch] text-[18px] leading-snug text-ink-2 md:text-[20px]">Every club on one calendar, with live updates when plans change.</p>
        </Entrance>
        <Entrance delay={0.38} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Magnetic>
            <Link href="/signin?mode=signup" className={cta}>
              Sign up free
            </Link>
          </Magnetic>
          <Link href="#calendar" className="text-[16px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] transition-colors duration-fast hover:decoration-ink">
            See this month
          </Link>
        </Entrance>
      </div>

      {list.length > 0 && (
        <Entrance delay={0.2}>
          <section aria-labelledby="upnext-h" className="rounded-3xl border border-line-strong bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-36px_rgba(60,40,10,0.45)]">
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <h2 id="upnext-h" className="text-[15px] font-semibold text-ink">
                {upNext.length ? "Up next on campus" : "Recently on campus"}
              </h2>
              <Link href="/events" className="-my-3 inline-flex min-h-11 items-center px-2 text-[13.5px] font-semibold text-ink-muted transition-colors duration-fast hover:text-ink">
                See all
              </Link>
            </div>
            <ul>
              {list.map((e) => {
                const live = seatState(e, now) === "live";
                const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
                return (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="group flex items-center gap-4 rounded-2xl p-3 transition-colors duration-fast hover:bg-sunken">
                      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl text-white">
                        <EventArt accent={e.accent} seed={e.id} flat scrim={false} />
                        <span className="relative text-center leading-none">
                          <span className="block text-[10px] font-semibold opacity-85">{fmtDate(e.startsAt, { month: "short" })}</span>
                          <span className="block text-[20px] font-semibold">{fmtDate(e.startsAt, { day: "numeric" })}</span>
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15.5px] font-semibold text-ink">{e.title}</span>
                        <span className="block truncate text-[13.5px] text-ink-muted">
                          {fmtTime(e.startsAt)} · {e.venueName ?? "Venue TBA"}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[13px]">
                        {live ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                            <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Live
                          </span>
                        ) : upNext.length ? (
                          <>
                            <span className="block font-semibold tabular-nums text-ink">{e.feePaise ? formatINR(e.feePaise) : "Free"}</span>
                            {left !== null && <span className="block tabular-nums text-ink-muted">{left === 0 ? "Full" : `${left} left`}</span>}
                          </>
                        ) : (
                          <span className="text-ink-muted">{e.registered} went</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </Entrance>
      )}
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
      <Spotlight tone="light" className="overflow-hidden rounded-3xl bg-white shadow-[0_0_0_1px_#DCD6C6,inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-36px_rgba(60,40,10,0.45)]">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <Link href={`/events/${e.slug}`} className="group relative block aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[420px]" aria-label={e.title}>
            <EventArt accent={e.accent} seed={e.id} scrim={false} />
            <span className="absolute left-5 top-5 z-[2] rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-ink shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
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

/** OnePass: one pass for every event, from finding it to the scan at the gate. */
export function HowItWorks() {
  const steps = [
    {
      t: "Find an event",
      b: "Search, or browse by day and kind.",
      art: (
        <div className="flex h-11 w-full max-w-[300px] items-center gap-2 rounded-full border border-line-strong bg-white px-4 shadow-search">
          <Search className="size-4 text-ink" strokeWidth={2.4} aria-hidden />
          <span className="text-[13px] text-ink-2">hackathon</span>
          <span className="ml-auto grid size-7 place-items-center rounded-full bg-accent text-white">
            <Search className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
        </div>
      ),
    },
    {
      t: "Register",
      b: "Your pass is saved to your account and your phone.",
      art: (
        <div className="flex w-full max-w-[300px] items-center gap-3 rounded-2xl border border-line-strong bg-white p-3 shadow-search">
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
      t: "Get scanned at the gate",
      b: "Show the QR. It works without internet.",
      art: (
        <div className="flex w-full max-w-[300px] items-center gap-2 rounded-2xl bg-live-soft px-4 py-3.5 text-[14px] font-semibold text-live">
          <span className="grid size-7 place-items-center rounded-full bg-live text-white">
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </span>
          Admitted, 7:02 pm
        </div>
      ),
    },
  ];
  return (
    <Reveal as="section" className="grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
      <div id="onepass" className="scroll-mt-28 lg:sticky lg:top-[calc(var(--header-h)+40px)] lg:self-start">
        <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
          OnePass. <em>One pass for every gate.</em>
        </h2>
      </div>
      <figure>
        <ol className="divide-y divide-line-strong border-y border-line-strong">
          {steps.map((s, i) => (
            <li key={s.t} className="grid gap-5 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8">
              <span className="font-display text-[44px] leading-none text-ink-subtle" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="text-[20px] font-semibold text-ink">{s.t}</h3>
                <p className="mt-1 max-w-[36ch] text-[15.5px] text-ink-2">{s.b}</p>
              </div>
              <div data-sample="true">{s.art}</div>
            </li>
          ))}
        </ol>
        <figcaption className="mt-3 text-[12.5px] text-ink-subtle">Example screens. Your pass shows your own event and code.</figcaption>
      </figure>
    </Reveal>
  );
}

/* ── Kinds bento ────────────────────────────────────────── */

export function KindBento({ kinds }: { kinds: KindCount[] }) {
  if (kinds.length < 3) return null;
  const tiles = kinds.slice(0, 5);
  return (
    <Reveal as="section" aria-labelledby="kinds-h" className="py-10">
      <div className="flex items-end justify-between gap-4">
        <h2 id="kinds-h" className="text-[22px] font-semibold tracking-[-0.01em] text-ink">
          Browse by kind
        </h2>
        <Link href="/events" className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          All events
        </Link>
      </div>
      <div className="mt-5 grid auto-rows-[150px] grid-cols-2 gap-4 md:auto-rows-[180px] md:grid-cols-4">
        {tiles.map((k, i) => (
          <div key={k.key} className={i === 0 ? "col-span-2 row-span-2" : i === 3 ? "col-span-2 md:col-span-1" : ""}>
            <Link href={`/events?type=${k.key}`} className="group block h-full">
              <Spotlight tone="light" className="h-full overflow-hidden rounded-[20px] transition-transform duration-slow ease-out group-hover:-translate-y-0.5">
                <EventArt accent={k.accent} seed={k.seed} scrim />
                <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between p-5 text-white">
                  <div>
                    <p className={i === 0 ? "font-display text-[44px] leading-none tracking-[-0.02em]" : "text-[20px] font-semibold"}>{k.title}</p>
                    <p className="mt-1 text-[14px] font-medium text-white/85">
                      {k.count} upcoming
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white/20 transition-transform duration-base">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Spotlight>
            </Link>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/* ── Venues ─────────────────────────────────────────────── */

export function Venues({ venues }: { venues: VenueCount[] }) {
  if (venues.length < 2) return null;
  return (
    <Reveal as="section" aria-labelledby="venues-h" className="py-10">
      <div className="flex items-end justify-between gap-4">
        <h2 id="venues-h" className="text-[22px] font-semibold tracking-[-0.01em] text-ink">
          Around campus
        </h2>
        <Link href="/venues" className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          All venues
        </Link>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <li key={v.name}>
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
          </li>
        ))}
      </ul>
    </Reveal>
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
    <Reveal as="section" className="my-10 grid gap-px overflow-hidden rounded-3xl bg-line-strong sm:grid-cols-3">
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
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-lavender/60 px-7 pt-10 ring-1 ring-inset ring-[#E2C8F7] md:grid-cols-2 md:px-14 md:pt-0">
        <div className="md:py-14">
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
            Your pass, <em>on your home screen.</em>
          </h2>
          <ul className="mt-6 space-y-2 text-[16px] text-ink-2">
            <li>Opens straight to your passes</li>
            <li>Works without internet at the gate</li>
          </ul>
          <Link href="/get-app" className={`${cta} mt-8`}>
            <Smartphone className="size-4" aria-hidden /> Install the app
          </Link>
        </div>
        <div className="flex justify-center self-end">
          <div data-sample="true" aria-label="Example of the app showing a pass" className="w-[250px] translate-y-6 rounded-t-[24px] border-[10px] border-b-0 border-ink bg-white px-4 pb-10 pt-6 shadow-[0_30px_60px_-20px_rgba(60,20,90,0.45)]">
            <div className="mx-auto h-1.5 w-16 rounded-full bg-ink/15" />
            <p className="mt-5 text-[12px] font-semibold text-ink-muted">Example</p>
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
    <Reveal as="section" className="mb-4 mt-6 border-t border-line-strong pt-16 md:pt-20">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <h2 className="max-w-[14ch] font-display text-[clamp(44px,6vw,84px)] leading-[0.95] tracking-[-0.03em] text-ink">
          See you <em>at the gate.</em>
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Magnetic>
            <Link href="/signin?mode=signup" className={cta}>
              Sign up free
            </Link>
          </Magnetic>
          <Link href="/events" className="text-[16px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] transition-colors duration-fast hover:decoration-ink">
            Browse events
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
