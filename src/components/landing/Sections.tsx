import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Navigation,
  Search,
  Smartphone,
} from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import type { KindCount, VenueCount } from "@/lib/data/landing";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Entrance, MaskedLines } from "@/components/motion/MaskedLines";
import { Spotlight } from "@/components/motion/Spotlight";
import { Focus } from "@/components/motion/Focus";
import { Tilt } from "@/components/motion/Tilt";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { CountUp, Countdown } from "./Live";
import { seatState } from "./EventCard";
import { HeroSearch } from "./HeroSearch";
import { HeroShowcase } from "./HeroShowcase";
import { qrArtSvg } from "@/lib/qr-art";

const cta =
  "ui-press ui-sheen relative inline-flex h-12 items-center justify-center gap-2 rounded-[14px] whitespace-nowrap bg-lavender px-6 text-[16px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink hover:bg-lavender-hover";
/* ── Hero: split, text left, the real "up next" list right (antislop layouts §17a) ── */

/**
 * The visitor's first screen: what EvntCult is on the left, with a search and one primary action;
 * on the right, an example pass you can tilt and a tiny printer that prints one. No real events:
 * names, dates and venues are only for signed-in people.
 */
export function Hero() {
  const qr = qrArtSvg("https://evntcult.caliper.workers.dev", {
    ink: "#1A1A1A",
    accent: "#E3264F",
  });
  return (
    <section
      aria-labelledby="hero-h"
      className="pb-14 pt-8 md:pt-14 lg:pb-20"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
        <div>
          <h1
            id="hero-h"
            className="font-display text-[clamp(58px,8.4vw,122px)] leading-[0.88] tracking-[-0.04em] text-ink"
          >
            <MaskedLines
              lines={["Every event,", <em key="em">one pass.</em>]}
            />
          </h1>
          <Entrance delay={0.3}>
            <p className="mt-7 max-w-[38ch] text-[18px] leading-snug text-ink-2 md:text-[20px]">
              Concerts, meetups, workshops, parties and hackathons, all on one
              calendar. Register in a tap and walk in with your phone.
            </p>
          </Entrance>
          <Entrance delay={0.36} className="relative z-10">
            <HeroSearch />
          </Entrance>
          <Entrance
            delay={0.42}
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <Magnetic>
              <Link href="/signin?mode=signup" className={cta}>
                Sign up free
              </Link>
            </Magnetic>
            <Link
              href="/host"
              className="text-[16px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] transition-colors duration-fast hover:decoration-ink"
            >
              Host an event
            </Link>
          </Entrance>
        </div>
        <Entrance delay={0.2}>
          <HeroShowcase qr={qr} />
        </Entrance>
      </div>

      {/* Editorial architectural truth strip — real product mechanics, zero invented stats */}
      <Entrance delay={0.5}>
        <dl className="mt-14 grid grid-cols-2 divide-y divide-line border-t border-line pt-6 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            ["0% platform fee", "Direct UPI straight to clubs"],
            ["Offline QR gates", "Scans in under a second without Wi-Fi"],
            ["On-device Face ID", "Event photos land in your Vault"],
            ["Verified certificates", "Tamper-proof codes on every issue"],
          ].map(([head, sub]) => (
            <div key={head} className="py-3 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
              <dt className="text-[14px] font-semibold text-ink">{head}</dt>
              <dd className="mt-0.5 text-[13px] text-ink-muted">{sub}</dd>
            </div>
          ))}
        </dl>
      </Entrance>
    </section>
  );
}

/* ── Featured event ─────────────────────────────────────── */

export function Featured({ e }: { e: EventSummary }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const pct = e.capacity
    ? Math.min(100, Math.round((e.registered / e.capacity) * 100))
    : null;
  return (
    <Reveal as="section" className="pt-10">
      <h2 className="sr-only">Featured event</h2>
      <Spotlight
        tone="light"
        className="overflow-hidden rounded-3xl bg-white shadow-[0_0_0_1px_#DCD6C6,inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-36px_rgba(60,40,10,0.45)]"
      >
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <Link
            href={`/events/${e.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[420px]"
            aria-label={e.title}
          >
            <EventArt accent={e.accent} seed={e.id} scrim={false} />
          </Link>
          <div className="relative z-[2] flex flex-col p-7 md:p-10">
            {state !== "live" && <p className="text-[14px] font-semibold text-ink-muted">Starts in</p>}
            <Countdown
              to={e.startsAt.toISOString()}
              end={e.endsAt.toISOString()}
              className="mt-1 font-display text-[44px] leading-none tracking-[-0.02em] text-ink md:text-[56px]"
            />
            <h3 className="mt-6 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[34px]">
              {e.title}
            </h3>
            {e.tagline && (
              <p className="mt-2 max-w-[40ch] text-[16px] text-ink-2">
                {e.tagline}
              </p>
            )}
            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-5 text-[14px]">
              <div>
                <dt className="text-ink-muted">When</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {fmtDate(e.startsAt, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  , {fmtTime(e.startsAt)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Where</dt>
                <dd className="mt-0.5 truncate font-semibold text-ink">
                  {e.venueName ?? "Venue TBA"}
                </dd>
              </div>
            </dl>
            {pct !== null && (
              <div className="mt-5">
                <div className="flex justify-between text-[13.5px]">
                  <span className="font-semibold text-ink">
                    {e.registered} going
                  </span>
                  <span className="text-ink-muted">
                    {left === 0 ? "Full" : `${left} seats left`}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                  <div
                    className="h-full rounded-full bg-ink transition-[width] duration-slow"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
              <Magnetic>
                <Link href={`/events/${e.slug}#register`} className={cta}>
                  {e.feePaise
                    ? `Register, ${formatINR(e.feePaise)}`
                    : "Register free"}
                </Link>
              </Magnetic>
              <Link
                href={`/events/${e.slug}`}
                className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
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
      b: "",
      art: (
        <div className="flex h-11 w-full max-w-[300px] items-center gap-2 rounded-lg border border-line-strong bg-white px-4 shadow-search">
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
      b: "",
      art: (
        <div className="flex w-full max-w-[300px] items-center gap-3 rounded-2xl border border-line-strong bg-white p-3 shadow-search">
          <div
            className="grid size-12 shrink-0 grid-cols-4 gap-[2px] rounded-md bg-white p-1 ring-1 ring-line"
            aria-hidden
          >
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className={
                  [0, 1, 3, 4, 6, 9, 11, 12, 14, 15].includes(i) ? "bg-ink" : ""
                }
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">Your pass</p>
            <p className="font-display text-[16px] text-ink-muted">
              Calm Badger
            </p>
          </div>
        </div>
      ),
    },
    {
      t: "Get scanned at the gate",
      b: "",
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
    <Reveal
      as="section"
      className="grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.5fr] lg:gap-16"
    >
      <div
        id="onepass"
        className="scroll-mt-28 lg:sticky lg:top-[calc(var(--header-h)+40px)] lg:self-start"
      >
        <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
          One pass for every gate.
        </h2>
      </div>
      <figure>
        <ol className="divide-y divide-line-strong border-y border-line-strong">
          {steps.map((s, i) => (
            <li key={s.t}>
              <Focus className="grid gap-5 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8">
                <span
                  className="font-display text-[44px] leading-none text-ink-subtle"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[20px] font-semibold text-ink">{s.t}</h3>
                  {s.b && <p className="mt-1 max-w-[36ch] text-[15.5px] text-ink-2">{s.b}</p>}
                </div>
                <div data-sample="true">{s.art}</div>
              </Focus>
            </li>
          ))}
        </ol>
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
        <h2
          id="kinds-h"
          className="text-[22px] font-semibold tracking-[-0.01em] text-ink"
        >
          Browse by kind
        </h2>
        <Link
          href="/events"
          className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          All events
        </Link>
      </div>
      <div className="mt-5 grid auto-rows-[150px] grid-cols-2 gap-4 md:auto-rows-[180px] md:grid-cols-4">
        {tiles.map((k, i) => (
          <div
            key={k.key}
            className={
              i === 0
                ? "col-span-2 row-span-2"
                : i === 3
                  ? "col-span-2 md:col-span-1"
                  : ""
            }
          >
            <Link href={`/events?type=${k.key}`} className="group block h-full">
              <Spotlight
                tone="light"
                className="h-full overflow-hidden rounded-[20px] transition-transform duration-slow ease-out group-hover:-translate-y-0.5"
              >
                <EventArt accent={k.accent} seed={k.seed} scrim />
                <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between p-5 text-white">
                  <div>
                    <p
                      className={
                        i === 0
                          ? "font-display text-[44px] leading-none tracking-[-0.02em]"
                          : "text-[20px] font-semibold"
                      }
                    >
                      {k.title}
                    </p>
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
        <h2
          id="venues-h"
          className="text-[22px] font-semibold tracking-[-0.01em] text-ink"
        >
          Venues near you
        </h2>
        <Link
          href="/venues"
          className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          All venues
        </Link>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <li key={v.name}>
            <Link
              href={`/venues?to=${encodeURIComponent(v.name)}`}
              className="group flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-[box-shadow,transform] duration-base hover:-translate-y-0.5 hover:shadow-raised"
            >
              <MapPin className="size-5 shrink-0 text-ink-2" strokeWidth={1.75} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold text-ink">
                  {v.name}
                </span>
                <span className="block truncate text-[13.5px] text-ink-muted">
                  {v.count} upcoming, next {v.next.title}
                </span>
              </span>
              <Navigation
                className="size-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/* ── App ────────────────────────────────────────────────── */

export function AppBand() {
  return (
    <Reveal as="section" className="my-24 md:my-32">
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-lavender/60 px-7 pt-10 ring-1 ring-inset ring-[#E2C8F7] md:grid-cols-2 md:px-14 md:pt-0">
        <div className="md:py-14">
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
            Your pass, on your home screen.
          </h2>
          <ul className="mt-6 space-y-2 text-[16px] text-ink-2">
            <li>Opens straight to your passes</li>
            <li>Works without internet at the gate</li>
          </ul>
          <Link
            href="/get-app"
            className="ui-press ui-sheen mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#1A1A1A] px-6 text-[16px] font-semibold !text-[#FFFEF6] shadow-button hover:bg-black [&_svg]:!text-[#FFFEF6]"
          >
            <Smartphone className="size-4" aria-hidden /> Install the app
          </Link>
        </div>
        <div className="flex justify-center self-end">
          <Tilt max={5}>
            <div
              data-sample="true"
              aria-label="Example of the app showing a pass"
              className="paper-keep w-[250px] translate-y-6 rounded-t-[24px] border-[10px] border-b-0 border-[#1A1A1A] bg-white px-4 pb-10 pt-6 shadow-[0_30px_60px_-20px_rgba(60,20,90,0.45)]"
            >
            <div className="mx-auto h-1.5 w-16 rounded-full bg-ink/15" />
            <p className="mt-5 text-[12px] font-semibold text-ink-muted">
              Example
            </p>
            <p className="text-[17px] font-semibold leading-tight text-ink">
              Your next event
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line-strong">
              <div className="relative h-20">
                <EventArt accent="orange" seed="app-pass" scrim={false} />
              </div>
              <div className="flex items-center gap-3 p-3">
                <div
                  className="grid size-14 grid-cols-5 gap-[2px] rounded-md p-1 ring-1 ring-line"
                  aria-hidden
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <span
                      key={i}
                      className={(i * 3 + (i % 4)) % 2 === 0 ? "bg-ink" : ""}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-ink">Pass</p>
                  <p className="font-display text-[16px] text-ink-muted">
                    Calm Badger
                  </p>
                </div>
              </div>
            </div>
          </div>
          </Tilt>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Closing ────────────────────────────────────────────── */

export function Closing() {
  return (
    <Reveal
      as="section"
      className="mb-4 mt-6 rounded-[24px] bg-surface p-8 shadow-card md:p-14"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <h2 className="max-w-[14ch] font-display text-[clamp(44px,6vw,84px)] leading-[0.95] tracking-[-0.03em] text-ink">
          See you at <em>the gate.</em>
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Magnetic>
            <Link href="/signin?mode=signup" className={cta}>
              Sign up free
            </Link>
          </Magnetic>
          <Link
            href="/events"
            className="text-[16px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] transition-colors duration-fast hover:decoration-ink"
          >
            Browse events
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
