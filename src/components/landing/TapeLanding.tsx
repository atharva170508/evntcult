"use client";

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

const GALLERY = [
  {
    src: "/images/rooftop-night.jpg",
    title: "Rooftop Evenings",
    href: "/category/party",
    aspect: "aspect-[4/3]",
  },
  {
    src: "/images/stage-spotlight.jpg",
    title: "Keynotes & Panels",
    href: "/category/talk",
    aspect: "aspect-[3/4]",
  },
  {
    src: "/images/hero-hall.jpg",
    title: "Live Concerts",
    href: "/category/cultural",
    aspect: "aspect-[3/4]",
  },
  {
    src: "/images/gate-desk.jpg",
    title: "Instant Gate Entry",
    href: "/passes",
    aspect: "aspect-[4/3]",
  },
] as const;

/**
 * Luxury Minimal EvntCult Landing Page:
 * Deep charcoal (#161820), warm ivory (#EFEAE0), champagne gold (#D4B87A),
 * Cormorant Garamond 700 italic + Inter 300 — zero tag-strip clutter, zero calculators.
 */
export function TapeLanding() {
  const reduce = useReducedMotion();

  return (
    <div className="bg-[#161820] text-[#EFEAE0]">
      {/* 1. HERO — Pure full-bleed photography, monumental serif, search & CTAs */}
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
          <m.h1
            id="hero-h"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="font-display font-bold italic leading-[0.88] tracking-[-0.02em] text-[#EFEAE0]"
            style={{ fontSize: "clamp(60px, 9.4vw, 140px)" }}
          >
            Every Event.
            <br />
            <span className="text-[#D4B87A]">One Pass.</span>
          </m.h1>

          <m.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
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
              <p className="mt-1.5 text-[13.5px] font-light text-[#9D978C]">{item.sub}</p>
            </m.div>
          ))}
        </div>
      </section>

      {/* 3. CATEGORIES — Pure architectural index rows */}
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

      {/* 4. EDITORIAL GALLERY — Sharp 3px-gap photography showcase */}
      <section className="border-y border-[#2E3342] bg-[#1E212B] py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <h2 className="font-display text-[clamp(42px,5.4vw,72px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
            The Atmosphere
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-[3px] md:grid-cols-2">
            {GALLERY.map((item, idx) => (
              <m.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: idx * 0.08, ease: EASE }}
              >
                <Link
                  href={item.href}
                  className={`group relative block overflow-hidden bg-[#161820] ${item.aspect}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 flex items-end bg-[#161820]/0 p-6 transition-colors duration-base group-hover:bg-[#161820]/70 md:p-8">
                    <div className="flex w-full items-center justify-between opacity-95 transition-opacity duration-base md:opacity-0 md:group-hover:opacity-100">
                      <span className="font-display text-[32px] font-semibold italic leading-none text-[#EFEAE0]">
                        {item.title}
                      </span>
                      <ArrowRight className="size-5 text-[#D4B87A]" aria-hidden />
                    </div>
                  </div>
                </Link>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOUR STEPS — Minimal editorial cadence */}
      <section className="bg-[#161820] py-24 md:py-28">
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
