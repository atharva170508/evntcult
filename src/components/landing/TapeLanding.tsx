"use client";

import { useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowRight, Search } from "lucide-react";
import { CATEGORY_HUBS } from "@/lib/discovery";

const EASE = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  { title: "Offline QR", sub: "Works without WiFi" },
  { title: "Direct UPI", sub: "Zero platform fee" },
  { title: "Photo Vault", sub: "Private face match" },
  { title: "Certificates", sub: "Verified by link" },
] as const;

const STEPS = [
  { num: "01", title: "Discover", sub: "Find what is on." },
  { num: "02", title: "Claim", sub: "Free or direct UPI." },
  { num: "03", title: "Enter", sub: "Scan offline at doors." },
  { num: "04", title: "Keep", sub: "Photos & signed certs." },
] as const;

/** Minimal interactive Offline Gate QR Scanner Aperture (1.5px champagne gold SVG). */
function GatePassAperture() {
  const [verified, setVerified] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[6px] border border-[#2E3342] bg-[#161820]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/gate-desk.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(22,24,32,0.68), rgba(22,24,32,0.92))",
        }}
      />

      <div className="tr-reel-stage relative z-10 flex flex-col items-center justify-center px-6 py-14 text-center">
        <button
          type="button"
          onClick={() => setVerified((v) => !v)}
          aria-pressed={verified}
          className="group flex flex-col items-center focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 280 200"
            fill="none"
            className="w-full max-w-[250px] text-[#D4B87A]"
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

          <span className="mt-7 inline-flex min-h-[44px] items-center rounded-[4px] border border-[#D4B87A] px-5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#D4B87A] transition-colors group-hover:bg-[#D4B87A] group-hover:text-[#161820]">
            {verified ? "Admitted · 0.3s Offline" : "Test Offline Scan"}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Ultra-minimal Luxury Editorial EvntCult Landing Page:
 * Deep charcoal (#161820), warm ivory (#EFEAE0), champagne gold (#D4B87A),
 * Cormorant Garamond 700 italic + Inter 300 — radical subtraction, zero paragraphs.
 */
export function TapeLanding() {
  const reduce = useReducedMotion();
  const [attendees, setAttendees] = useState(400);
  const [price, setPrice] = useState(250);

  const saved = Math.round(attendees * price * 0.08);

  return (
    <div className="bg-[#161820] text-[#EFEAE0]">
      {/* 1. HERO — Pure photography, monumental headline, search & CTAs */}
      <section
        aria-labelledby="hero-h"
        className="relative flex min-h-[clamp(560px,92vh,880px)] flex-col items-center justify-end overflow-hidden bg-[#161820] px-5 pb-[8vh] pt-28 text-center md:px-10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-hall.jpg"
          alt="Warm timber performance hall lit by tungsten pendant lamps"
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(22,24,32,0.52) 0%, rgba(22,24,32,0.16) 40%, rgba(22,24,32,0.94) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[920px] flex-col items-center">
          <m.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0, ease: EASE }}
            className="tr-meta text-[#D4B87A]"
          >
            Live Events · Offline QR · Direct UPI
          </m.p>

          <m.h1
            id="hero-h"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
            className="mt-4 font-display font-bold italic leading-[0.88] tracking-[-0.02em] text-[#EFEAE0]"
            style={{ fontSize: "clamp(58px, 9.2vw, 136px)" }}
          >
            Every Event.
            <br />
            <span className="text-[#D4B87A]">One Pass.</span>
          </m.h1>

          <m.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
            className="mt-10 flex w-full max-w-[500px] flex-col items-center gap-5"
          >
            <form
              action="/events"
              method="get"
              role="search"
              className="flex w-full items-center gap-2 rounded-[4px] border border-[#EFEAE0]/25 bg-[#161820]/75 px-4 backdrop-blur-md transition-colors focus-within:border-[#D4B87A]"
            >
              <Search className="size-4 shrink-0 text-[#D4B87A]" aria-hidden />
              <label htmlFor="hero-q" className="sr-only">
                Search events
              </label>
              <input
                id="hero-q"
                name="q"
                type="search"
                placeholder="Search events or venues..."
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
                Explore
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      {/* 2. PILLARS STRIP — 4 crisp phrases only */}
      <section className="border-y border-[#2E3342] border-t-[#D4B87A]/70 bg-[#1E212B] py-12 md:py-14">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-5 lg:grid-cols-4 md:px-10">
          {PILLARS.map((item, i) => (
            <m.div
              key={item.title}
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
            >
              <h2 className="font-display text-[28px] font-semibold italic leading-tight text-[#D4B87A]">
                {item.title}
              </h2>
              <p className="tr-meta mt-2 text-[#9D978C]">{item.sub}</p>
            </m.div>
          ))}
        </div>
      </section>

      {/* 3. CATEGORIES — Pure architectural index rows, zero blurb clutter */}
      <section className="bg-[#161820] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(42px,5.4vw,72px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
              Explore
            </h2>
            <Link
              href="/events"
              className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#9D978C] hover:text-[#D4B87A]"
            >
              All events
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
            {CATEGORY_HUBS.map((hub, i) => (
              <li key={hub.slug}>
                <Link
                  href={`/category/${hub.slug}`}
                  className="group flex items-center justify-between gap-6 px-2 py-6 transition-colors duration-base hover:bg-[#1E212B] md:px-5 md:py-7"
                >
                  <div className="flex items-baseline gap-5 md:gap-8">
                    <span className="font-mono text-[11px] tabular-nums text-[#9D978C]">
                      0{i + 1}
                    </span>
                    <span className="font-display text-[clamp(30px,3.6vw,48px)] font-semibold italic leading-tight text-[#EFEAE0] transition-colors group-hover:text-[#D4B87A]">
                      {hub.name}
                    </span>
                  </div>
                  <ArrowRight
                    className="size-5 shrink-0 text-[#D4B87A] transition-transform duration-base group-hover:translate-x-1.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. FOUR STEPS — Ultra-short editorial cadence */}
      <section className="border-y border-[#2E3342] bg-[#1E212B] py-24 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <ol className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step) => (
              <li key={step.num} className="relative pt-10">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 left-0 select-none font-display text-[88px] font-bold italic leading-none text-[#D4B87A]/[0.09]"
                >
                  {step.num}
                </span>
                <p className="tr-meta relative text-[#D4B87A]">{step.num}</p>
                <h3 className="relative mt-2 font-display text-[32px] font-semibold italic leading-tight text-[#EFEAE0]">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-[14.5px] font-light text-[#9D978C]">
                  {step.sub}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. INTERACTIVE TOOLS — Zero-Fee Calculator + Live Offline Scan */}
      <section className="bg-[#161820] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 md:px-10">
          <div>
            <p className="tr-meta text-[#D4B87A]">For Organizers</p>
            <h2 className="mt-3 font-display text-[clamp(44px,5.4vw,72px)] font-bold italic leading-[0.92] text-[#EFEAE0]">
              Zero Cut.
            </h2>

            <div className="mt-10 grid gap-7 sm:grid-cols-2">
              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="tr-meta text-[#9D978C]">Guests</span>
                  <span className="font-display text-[32px] font-semibold italic tabular-nums text-[#EFEAE0]">
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
                  <span className="tr-meta text-[#9D978C]">Ticket</span>
                  <span className="font-display text-[32px] font-semibold italic tabular-nums text-[#EFEAE0]">
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

            <div className="mt-10 flex items-baseline justify-between border-y border-[#2E3342] py-5">
              <span className="tr-meta text-[#9D978C]">Saved vs 8% fee</span>
              <span className="font-display text-[44px] font-bold italic tabular-nums text-[#D4B87A]">
                INR {saved.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <GatePassAperture />
        </div>
      </section>

      {/* 6. CHAMPAGNE GOLD CTA BAND — Monumental & silent */}
      <section className="bg-[#D4B87A] py-20 text-[#161820] md:py-28">
        <div className="mx-auto flex max-w-[920px] flex-col items-center px-5 text-center md:px-10">
          <h2 className="font-display text-[clamp(44px,6.4vw,88px)] font-bold italic leading-[0.9] tracking-[-0.02em] text-[#161820]">
            Your Next Event Starts Here.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
              Host an event
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
