"use client";

import { useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowRight, Plus, Search } from "lucide-react";
import { CATEGORY_HUBS } from "@/lib/discovery";

const EASE = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  {
    title: "Offline QR Passes",
    desc: "Signed locally on your phone. Scans at the door in under a second even without WiFi.",
  },
  {
    title: "Direct Club UPI",
    desc: "Ticket payments go straight to your club UPI ID with built in UTR confirmation and zero cut.",
  },
  {
    title: "Face ID Photo Vault",
    desc: "One private selfie after sign in gathers every photo of you from events you attended.",
  },
  {
    title: "Verified Certificates",
    desc: "Attendance and winner certificates issued in one click with permanent verification links.",
  },
] as const;

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Pick an Event",
    desc: "Search concerts, hackathons, workshops, sports, and club talks on one live campus board.",
  },
  {
    num: "02",
    title: "Claim or Pay UPI",
    desc: "Lock in free seats instantly or pay paid fests directly to the club with zero markup.",
  },
  {
    num: "03",
    title: "Scan at the Gate",
    desc: "Open your offline pass on your phone. Volunteers verify entries in under a second.",
  },
  {
    num: "04",
    title: "Vault & Certificates",
    desc: "Event photos land automatically in your Vault and signed certificates arrive in your profile.",
  },
] as const;

const EVNTCULT_FAQ: [string, string][] = [
  [
    "Do I need to print my pass?",
    "No. Show your QR on your phone at the gate. A saved pass or installed home screen app works even when auditorium WiFi drops.",
  ],
  [
    "How do payments work for paid events?",
    "Students pay directly to the club UPI ID and submit the UTR reference. Organizers confirm payments straight from their attendee table with zero platform commission.",
  ],
  [
    "Can I cancel my registration?",
    "Yes, anytime from My Passes before check in. Your freed seat automatically moves to the next student on the waitlist.",
  ],
  [
    "How does the Photo Vault protect privacy?",
    "Face matching runs strictly across events you actually registered for. Outsiders cannot browse or search your photos.",
  ],
  [
    "Where do my event certificates live?",
    "Every certificate issued by a club appears inside Certificates with a permanent public verification code anyone can check.",
  ],
  [
    "How does my campus club start hosting?",
    "Create a free account and submit a club verification request on the Host page. Once verified, you can publish events and share volunteer scan links immediately.",
  ],
];

/** Interactive Offline Gate QR Scanner Aperture (1.5px champagne gold SVG). */
function GatePassAperture() {
  const [verified, setVerified] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-[#2E3342] bg-[#161820]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/gate-desk.jpg"
        alt="Walnut check in desk with passes and smartphone"
        className="absolute inset-0 size-full object-cover opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(22,24,32,0.72), rgba(22,24,32,0.92))",
        }}
      />

      <div className="tr-reel-stage relative z-10 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="tr-meta text-[#D4B87A]">Offline Gate Verification</p>

        <button
          type="button"
          onClick={() => setVerified((v) => !v)}
          aria-pressed={verified}
          className="group mt-6 flex flex-col items-center focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 280 200"
            fill="none"
            className="w-full max-w-[260px] text-[#D4B87A]"
            role="img"
            aria-label="Interactive offline QR gate scanner"
          >
            <g className="tr-reel-cw">
              <circle
                cx="140"
                cy="100"
                r="76"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeDasharray="16 8"
              />
            </g>
            <g className="tr-reel-ccw">
              <circle
                cx="140"
                cy="100"
                r="58"
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeWidth="1.1"
                strokeDasharray="5 9"
              />
            </g>
            <g stroke="currentColor" strokeWidth="1.4">
              <path d="M106 78V66h12" />
              <path d="M174 78V66h-12" />
              <path d="M106 122v12h12" />
              <path d="M174 122v12h-12" />
            </g>
            {verified ? (
              <path
                d="M124 100l11 11 22-24"
                stroke="#EFEAE0"
                strokeWidth="1.8"
                strokeLinecap="square"
              />
            ) : (
              <g stroke="currentColor" strokeWidth="1.3">
                <rect x="118" y="78" width="13" height="13" />
                <rect x="149" y="78" width="13" height="13" />
                <rect x="118" y="109" width="13" height="13" />
                <path d="M148 111h14M148 120h9M136 98h8" />
                <line x1="108" y1="100" x2="172" y2="100" stroke="#EFEAE0" strokeOpacity="0.6" strokeWidth="1.1" />
              </g>
            )}
          </svg>

          <span className="mt-6 inline-flex min-h-[44px] items-center rounded-[4px] border border-[#D4B87A] px-5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#D4B87A] transition-colors group-hover:bg-[#D4B87A] group-hover:text-[#161820]">
            {verified ? "Admitted · Reset Scan" : "Test Offline Scan"}
          </span>
        </button>

        <p className="mt-4 max-w-[36ch] text-[13.5px] font-light text-[#9D978C]">
          {verified
            ? "Pass signature verified locally in 0.3 seconds with zero internet required."
            : "Every pass carries a signed offline QR token checked in by gate volunteers."}
        </p>
      </div>
    </div>
  );
}

/**
 * Custom EvntCult Cinematic Editorial Landing Page:
 * Deep midnight charcoal (#161820), warm ivory (#EFEAE0), champagne gold (#D4B87A),
 * Cormorant Garamond 700 italic + Inter 300/400/500 — built 100% for EvntCult's real workflows.
 */
export function TapeLanding() {
  const reduce = useReducedMotion();
  const [attendees, setAttendees] = useState(400);
  const [price, setPrice] = useState(250);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const gross = attendees * price;
  const saved = Math.round(gross * 0.08);

  return (
    <div className="bg-[#161820] text-[#EFEAE0]">
      {/* 1. HERO — Full-bleed auditorium with bottom-centered cinematic typography */}
      <section
        aria-labelledby="hero-h"
        className="relative flex min-h-[clamp(560px,92vh,880px)] flex-col items-center justify-end overflow-hidden bg-[#161820] px-5 pb-[7vh] pt-28 text-center md:px-10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-hall.jpg"
          alt="Warm timber college auditorium lit by tungsten pendant lamps"
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(22,24,32,0.58) 0%, rgba(22,24,32,0.18) 38%, rgba(22,24,32,0.92) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[920px] flex-col items-center">
          <m.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0, ease: EASE }}
            className="tr-meta text-[#D4B87A]"
          >
            Campus Event Platform · Offline QR &amp; Direct UPI
          </m.p>

          <m.h1
            id="hero-h"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="mt-4 font-display font-bold italic leading-[0.88] tracking-[-0.02em] text-[#EFEAE0]"
            style={{ fontSize: "clamp(54px, 8.6vw, 128px)" }}
          >
            Every Night on Campus.
            <br />
            <span className="text-[#D4B87A]">One Pass.</span>
          </m.h1>

          <m.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
            className="mt-6 max-w-[560px] text-[16px] font-light leading-[1.6] text-[#EFEAE0]/80 md:text-[17px]"
          >
            Concerts, hackathons, workshops, sports, and club fests on one live campus calendar. Claim your seat in a tap and walk in with your phone.
          </m.p>

          {/* Clean inline search + centered dual CTAs */}
          <m.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease: EASE }}
            className="mt-8 flex w-full max-w-[540px] flex-col items-center gap-5"
          >
            <form
              action="/events"
              method="get"
              role="search"
              className="flex w-full items-center gap-2 rounded-[4px] border border-[#EFEAE0]/25 bg-[#161820]/75 px-4 backdrop-blur-md transition-colors focus-within:border-[#D4B87A]"
            >
              <Search className="size-4 shrink-0 text-[#D4B87A]" aria-hidden />
              <label htmlFor="hero-q" className="sr-only">
                Search campus events
              </label>
              <input
                id="hero-q"
                name="q"
                type="search"
                placeholder="Search concerts, hackathons, workshops, or clubs..."
                className="h-12 min-w-0 flex-1 bg-transparent text-[14.5px] font-light text-[#EFEAE0] outline-none placeholder:text-[#EFEAE0]/55 [&::-webkit-search-cancel-button]:hidden"
              />
              <button
                type="submit"
                className="tr-meta inline-flex h-10 shrink-0 items-center gap-1 pl-2 text-[#D4B87A] hover:text-[#EFEAE0]"
              >
                Find <ArrowRight className="size-3.5" aria-hidden />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signin?mode=signup"
                className="group inline-flex h-12 items-center gap-2 rounded-[4px] bg-[#D4B87A] px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:bg-[#E0C78E]"
              >
                <span>Claim a seat</span>
                <ArrowRight className="size-3.5 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/events"
                className="inline-flex h-12 items-center rounded-[4px] border border-[#EFEAE0]/30 px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#EFEAE0] transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
              >
                Explore events
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      {/* 2. PILLARS STRIP — Full-width surface with champagne gold top border */}
      <section className="border-y border-[#2E3342] border-t-[#D4B87A]/70 bg-[#1E212B] py-14 md:py-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4 md:px-10">
          {PILLARS.map((item, i) => (
            <m.div
              key={item.title}
              initial={reduce ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
            >
              <h2 className="font-display text-[26px] font-semibold italic leading-tight text-[#D4B87A]">
                {item.title}
              </h2>
              <p className="mt-2 text-[14.5px] font-light leading-[1.6] text-[#9D978C]">
                {item.desc}
              </p>
            </m.div>
          ))}
        </div>
      </section>

      {/* 3. CAMPUS CATEGORIES — Full-width hover-raise rows wired to CATEGORY_HUBS */}
      <section className="bg-[#161820] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="tr-meta text-[#D4B87A]">Campus Directory</p>
              <h2 className="mt-3 font-display text-[clamp(42px,5.4vw,72px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
                What&apos;s On Campus
              </h2>
            </div>
            <Link
              href="/events"
              className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#9D978C] hover:text-[#D4B87A]"
            >
              Browse all events
            </Link>
          </div>

          <m.div
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mt-8 h-px origin-left bg-[#D4B87A]/50"
          />

          <ul className="divide-y divide-[#2E3342] border-b border-[#2E3342]">
            {CATEGORY_HUBS.map((hub) => (
              <li key={hub.slug}>
                <Link
                  href={`/category/${hub.slug}`}
                  className="group grid grid-cols-1 items-center gap-3 px-2 py-7 transition-colors duration-base hover:bg-[#1E212B] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] md:gap-8 md:px-5 md:py-8"
                >
                  <span className="font-display text-[clamp(28px,3.2vw,42px)] font-semibold italic leading-tight text-[#EFEAE0] transition-colors group-hover:text-[#D4B87A]">
                    {hub.name}
                  </span>
                  <span className="text-[15px] font-light leading-[1.55] text-[#9D978C]">
                    {hub.blurb}
                  </span>
                  <ArrowRight
                    className="size-5 text-[#D4B87A] transition-transform duration-base group-hover:translate-x-1.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. HOW EVNTCULT WORKS — 4 horizontal steps with large faded gold numerals */}
      <section className="border-y border-[#2E3342] bg-[#1E212B] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <p className="tr-meta text-[#D4B87A]">The Experience</p>
          <h2 className="mt-3 font-display text-[clamp(42px,5.4vw,72px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
            From Link to Gate
          </h2>

          <ol className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {PROCESS_STEPS.map((step) => (
              <li key={step.num} className="relative pt-10">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 left-0 select-none font-display text-[92px] font-bold italic leading-none text-[#D4B87A]/[0.09]"
                >
                  {step.num}
                </span>
                <p className="tr-meta relative text-[#D4B87A]">{step.num}</p>
                <h3 className="relative mt-2 font-display text-[28px] font-semibold italic leading-tight text-[#EFEAE0]">
                  {step.title}
                </h3>
                <p className="relative mt-3 text-[14.5px] font-light leading-[1.6] text-[#9D978C]">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. INTERACTIVE EVNTCULT SPLIT — Club UPI Calculator + Live Offline Gate Scanner */}
      <section className="bg-[#161820] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 md:px-10">
          <div>
            <p className="tr-meta text-[#D4B87A]">Built for Campus Clubs</p>
            <h2 className="mt-3 font-display text-[clamp(40px,5vw,66px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
              Zero Cut on Every Ticket
            </h2>
            <p className="mt-4 max-w-[46ch] text-[15.5px] font-light leading-[1.6] text-[#9D978C]">
              Students pay directly to your club UPI ID and submit their UTR. Estimate what your club keeps compared to standard ticketing gateways.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="tr-meta text-[#9D978C]">Attendees</span>
                  <span className="font-display text-[30px] font-semibold italic tabular-nums text-[#EFEAE0]">
                    {attendees.toLocaleString("en-IN")}
                  </span>
                </span>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={attendees}
                  onChange={(e) => setAttendees(Number(e.target.value))}
                  className="mt-3 w-full accent-[#D4B87A]"
                />
              </label>

              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="tr-meta text-[#9D978C]">Ticket Price</span>
                  <span className="font-display text-[30px] font-semibold italic tabular-nums text-[#EFEAE0]">
                    INR {price}
                  </span>
                </span>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-3 w-full accent-[#D4B87A]"
                />
              </label>
            </div>

            <dl className="mt-8 divide-y divide-[#2E3342] border-y border-[#2E3342]">
              <div className="flex items-baseline justify-between py-3.5">
                <dt className="text-[14.5px] font-light text-[#9D978C]">Total collection</dt>
                <dd className="font-mono text-[13px] tabular-nums text-[#EFEAE0]">
                  INR {gross.toLocaleString("en-IN")}
                </dd>
              </div>
              <div className="flex items-baseline justify-between py-3.5">
                <dt className="text-[14.5px] font-light text-[#9D978C]">EvntCult platform fee</dt>
                <dd className="font-mono text-[13px] tabular-nums text-[#D4B87A]">INR 0 (0%)</dd>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <dt className="font-display text-[26px] font-semibold italic text-[#EFEAE0]">
                  Saved vs 8% ticketing platforms
                </dt>
                <dd className="font-display text-[36px] font-bold italic tabular-nums text-[#D4B87A]">
                  INR {saved.toLocaleString("en-IN")}
                </dd>
              </div>
            </dl>
          </div>

          <GatePassAperture />
        </div>
      </section>

      {/* 6. FAQ — Real EvntCult Questions on deep surface */}
      <section className="border-t border-[#2E3342] bg-[#1E212B] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 md:grid-cols-3 md:px-10">
          <div>
            <p className="tr-meta text-[#D4B87A]">Questions</p>
            <h2 className="mt-3 font-display text-[clamp(38px,4.5vw,58px)] font-bold italic leading-[0.95] text-[#EFEAE0]">
              Good to Know
            </h2>
          </div>

          <div className="divide-y divide-[#2E3342] border-y border-[#2E3342] md:col-span-2">
            {EVNTCULT_FAQ.map(([q, a], i) => {
              const open = openFaq === i;
              return (
                <div key={q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="font-display text-[24px] font-semibold italic leading-snug text-[#EFEAE0]">
                      {q}
                    </span>
                    <Plus
                      className={`size-4 shrink-0 text-[#D4B87A] transition-transform duration-base ${
                        open ? "rotate-45" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <p className="pb-6 pr-8 text-[15px] font-light leading-[1.6] text-[#9D978C]">
                      {a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FULL-WIDTH CHAMPAGNE GOLD CTA BAND */}
      <section className="bg-[#D4B87A] py-20 text-[#161820] md:py-28">
        <div className="mx-auto flex max-w-[920px] flex-col items-center px-5 text-center md:px-10">
          <h2 className="font-display text-[clamp(42px,6vw,84px)] font-bold italic leading-[0.92] tracking-[-0.02em] text-[#161820]">
            Your Next Campus Night Starts Here.
          </h2>
          <p className="mt-5 max-w-[540px] text-[16px] font-light leading-[1.6] text-[#161820]/80">
            Free for every student and verified club. Claim your pass in seconds or publish your upcoming fest with direct UPI and offline check in.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signin?mode=signup"
              className="group inline-flex h-12 items-center gap-2 rounded-[4px] bg-[#161820] px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#EFEAE0] transition-colors hover:bg-[#262A36]"
            >
              <span>Sign up free</span>
              <ArrowRight className="size-3.5 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/host"
              className="inline-flex h-12 items-center rounded-[4px] border border-[#161820]/35 px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:border-[#161820]"
            >
              Apply to host
            </Link>
          </div>
          <p className="tr-meta mt-7 text-[#161820]/70">
            Offline QR · Direct UPI · On device Photo Vault
          </p>
        </div>
      </section>
    </div>
  );
}
