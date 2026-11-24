"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowRight, RefreshCw, RotateCw, ShieldCheck, Images, QrCode, CalendarDays } from "lucide-react";
import { BrandMark } from "@/components/site/Brand";
import { Tilt } from "@/components/motion/Tilt";
import { EASE } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

const VIBES = [
  {
    key: "PARTY",
    label: "Nights out",
    hint: "Rooftops & DJs",
    swatch: "#6D3DF5",
    bg: "linear-gradient(135deg, #25134D 0%, #5228B8 55%, #190D36 100%)",
    glow: "rgba(155, 110, 255, 0.32)",
    names: ["Sunset Sessions", "Rooftop Social", "Afterhours Vinyl"],
    venues: ["Riverside Lawn", "Terrace Deck", "Amphitheatre"],
    tag: "Entry + QR",
  },
  {
    key: "TECH",
    label: "Tech",
    hint: "Hackathons & AI",
    swatch: "#2346A8",
    bg: "linear-gradient(135deg, #0D1B45 0%, #1F42A3 55%, #0A1433 100%)",
    glow: "rgba(92, 146, 255, 0.30)",
    names: ["Hack Night", "Build with AI", "Campus Demo Day"],
    venues: ["Main Auditorium", "Innovation Lab", "Seminar Hall B"],
    tag: "Team pass",
  },
  {
    key: "SPORTS",
    label: "Sports",
    hint: "Turf & runs",
    swatch: "#D6652A",
    bg: "linear-gradient(135deg, #3D1808 0%, #B84D18 55%, #260E04 100%)",
    glow: "rgba(255, 148, 84, 0.30)",
    names: ["Box Cricket League", "Midnight 5K Run", "5-a-side Friday"],
    venues: ["North Turf", "Main Track", "East Court"],
    tag: "Player pass",
  },
  {
    key: "CULTURAL",
    label: "Culture",
    hint: "Fests & open mics",
    swatch: "#C7457A",
    bg: "linear-gradient(135deg, #421026 0%, #B02E63 55%, #2B0918 100%)",
    glow: "rgba(240, 110, 165, 0.30)",
    names: ["Garba Night", "Open Mic Poetry", "Acoustic Courtyard"],
    venues: ["Central Quad", "OAT Steps", "Heritage Hall"],
    tag: "General entry",
  },
  {
    key: "WORKSHOP",
    label: "Workshops",
    hint: "Hands-on labs",
    swatch: "#11796D",
    bg: "linear-gradient(135deg, #082E29 0%, #146E63 55%, #051F1C 100%)",
    glow: "rgba(74, 212, 190, 0.28)",
    names: ["Film Photo Walk", "Figma in 90 Mins", "Pottery Sunday"],
    venues: ["Design Studio", "Botanical Gate", "Craft Room 4"],
    tag: "Seat + cert",
  },
  {
    key: "GAMING",
    label: "Gaming",
    hint: "LAN & chess",
    swatch: "#E3264F",
    bg: "linear-gradient(135deg, #3D0A16 0%, #B81B3E 55%, #24050C 100%)",
    glow: "rgba(255, 86, 120, 0.30)",
    names: ["Valorant Cup", "Retro Arcade Night", "Blitz Chess Open"],
    venues: ["Esports Arena", "Student Lounge", "Library Lawn"],
    tag: "Bracket slot",
  },
] as const;

function greetingForNow(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function MiniBarcode() {
  const bars = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2];
  return (
    <div aria-hidden className="flex h-7 items-stretch gap-[2px] opacity-80">
      {bars.map((w, idx) => (
        <span key={idx} className="rounded-[0.5px] bg-[#FFFEF6]" style={{ width: `${w}px` }} />
      ))}
    </div>
  );
}

/**
 * Signed-in Home hero when the user doesn't have an upcoming pass yet.
 * Replaces the old dead 00:00:00 countdown with a tactile 3D interactive preview pass
 * paired with a clean 2x3 campus vibe console.
 */
export function EmptyTicket({ name, dateLine }: { name: string; dateLine: string }) {
  const reduce = !!useReducedMotion();
  const [vibeIdx, setVibeIdx] = useState(1); // Default to Tech or Nights out
  const [titleIdx, setTitleIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const vibe = VIBES[vibeIdx];
  const eventTitle = vibe.names[titleIdx % vibe.names.length];
  const venue = vibe.venues[titleIdx % vibe.venues.length];
  const firstName = name.trim().split(/\s+/)[0] || name;

  const selectVibe = (idx: number) => {
    setVibeIdx(idx);
    setTitleIdx(0);
    setFlipped(false);
  };

  return (
    <section aria-labelledby="home-greeting" className="pt-6 md:pt-10">
      {/* Top editorial greeting bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13.5px] font-medium text-ink-muted">{dateLine}</p>
          <h1
            id="home-greeting"
            className="mt-1 font-display text-[clamp(34px,4.2vw,52px)] leading-[0.98] tracking-[-0.03em] text-ink"
          >
            {greetingForNow()}, {firstName}.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/vault"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
          >
            <Images className="size-3.5 text-ink-muted" aria-hidden />
            Photo Vault
          </Link>
          <Link
            href="/calendar"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
          >
            <CalendarDays className="size-3.5 text-ink-muted" aria-hidden />
            Calendar
          </Link>
        </div>
      </div>

      {/* Main asymmetric two-column pass studio */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:items-stretch">
        {/* Left: Tactile 3D preview pass stage */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-line-strong bg-[#151413] p-6 text-[#FFFEF6] shadow-[0_36px_72px_-44px_rgba(20,16,10,0.65)] md:p-8">
          {/* Ambient radial glow tuned to selected vibe */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-[340px] rounded-full blur-[90px] transition-colors duration-500"
            style={{ background: vibe.glow }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(#FFFEF6 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Stage top controls */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-[#FFFEF6]/90 backdrop-blur-sm">
              <span className="size-2 rounded-full" style={{ backgroundColor: vibe.swatch }} aria-hidden />
              Your first pass preview
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setFlipped(false);
                  setTitleIdx((n) => n + 1);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12px] font-semibold text-[#FFFEF6]/90 transition-colors hover:bg-white/20"
                title="Show another example event"
              >
                <RefreshCw className="size-3" aria-hidden />
                Shuffle
              </button>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12px] font-semibold text-[#FFFEF6]/90 transition-colors hover:bg-white/20"
              >
                <RotateCw className="size-3" aria-hidden />
                {flipped ? "Front" : "Flip"}
              </button>
            </div>
          </div>

          {/* 3D Interactive Pass Card */}
          <div className="relative z-10 my-6" style={{ perspective: 1100 }}>
            <Tilt max={6}>
              <m.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 220, damping: 24 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative min-h-[248px] w-full"
              >
                {/* FRONT FACE */}
                <div
                  style={{ backfaceVisibility: "hidden", background: vibe.bg }}
                  className="relative flex min-h-[248px] flex-col justify-between overflow-hidden rounded-[22px] p-6 text-[#FFFEF6] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-white/15"
                >
                  {/* Subtle diagonal sheen */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.12)_0%,transparent_42%,rgba(0,0,0,0.25)_100%)]"
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrandMark className="size-4" />
                      <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-[#FFFEF6]/80">
                        EVNTCULT PASS
                      </span>
                    </div>
                    <span className="rounded-md bg-black/25 px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#FFFEF6]/90 backdrop-blur-sm">
                      {vibe.tag}
                    </span>
                  </div>

                  <div className="relative my-5">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.div
                        key={`${vibe.key}-${titleIdx}`}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.24, ease: EASE }}
                      >
                        <h2 className="font-display text-[clamp(32px,4vw,46px)] leading-[0.98] tracking-[-0.025em] text-[#FFFEF6]">
                          {eventTitle}
                        </h2>
                        <p className="mt-1.5 text-[14px] text-[#FFFEF6]/80">
                          {venue} · {vibe.label}
                        </p>
                      </m.div>
                    </AnimatePresence>
                  </div>

                  {/* Perforated tear divider */}
                  <div className="relative -mx-6 my-1 flex items-center">
                    <span className="size-3.5 -translate-x-1/2 rounded-full bg-[#151413]" aria-hidden />
                    <div className="flex-1 border-t border-dashed border-white/25" />
                    <span className="size-3.5 translate-x-1/2 rounded-full bg-[#151413]" aria-hidden />
                  </div>

                  <div className="relative mt-2 flex items-end justify-between gap-4">
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
                      <div>
                        <dt className="text-[#FFFEF6]/60">Admit one</dt>
                        <dd className="mt-0.5 max-w-[140px] truncate text-[14px] font-semibold text-[#FFFEF6]">
                          {name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#FFFEF6]/60">Gate</dt>
                        <dd className="mt-0.5 text-[14px] font-semibold text-[#FFFEF6]">Instant QR</dd>
                      </div>
                    </dl>
                    <MiniBarcode />
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  className="paper-keep absolute inset-0 flex flex-col justify-between rounded-[22px] bg-[#FFFEF6] p-6 text-[#1A1A1A] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.75)] ring-1 ring-black/10"
                >
                  <div className="flex items-center justify-between border-b border-dashed border-[#D8D1BE] pb-3">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.05em] text-[#6A6A6A]">
                      WHAT COMES WITH EVERY PASS
                    </span>
                    <BrandMark className="size-4" />
                  </div>

                  <ul className="my-3 space-y-2.5 text-[13.5px]">
                    <li className="flex items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F0D7FF] text-[#1A1A1A]">
                        <QrCode className="size-4" aria-hidden />
                      </span>
                      <span>
                        <strong className="font-semibold">Offline QR entry</strong> at the gate in 1 second
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F5F2E8] text-[#1A1A1A]">
                        <Images className="size-4" aria-hidden />
                      </span>
                      <span>
                        <strong className="font-semibold">Auto Photo Vault</strong> finds your photos automatically
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F5F2E8] text-[#1A1A1A]">
                        <ShieldCheck className="size-4" aria-hidden />
                      </span>
                      <span>
                        <strong className="font-semibold">Verified certificate</strong> saved straight to your profile
                      </span>
                    </li>
                  </ul>

                  <p className="font-mono text-[11px] text-[#6A6A6A]">
                    HOLDER: {name.toUpperCase()} · READY TO CLAIM
                  </p>
                </div>
              </m.div>
            </Tilt>
          </div>

          <p className="relative z-10 text-[13px] text-[#FFFEF6]/60">
            Claim any campus event and your real scannable pass appears right here.
          </p>
        </div>

        {/* Right: Personal Vibe Console */}
        <div className="flex flex-col justify-between rounded-[28px] border border-line-strong bg-surface p-6 shadow-card md:p-7">
          <div>
            <h2 className="font-display text-[28px] leading-[1.05] tracking-[-0.02em] text-ink">
              What are you into?
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
              Pick a category to preview your pass and jump straight to upcoming events.
            </p>

            {/* 2x3 Tactile Vibe Grid */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {VIBES.map((v, idx) => {
                const active = idx === vibeIdx;
                return (
                  <button
                    key={v.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectVibe(idx)}
                    className={cn(
                      "ui-press group flex flex-col items-start rounded-2xl border px-3.5 py-3 text-left transition-all duration-150",
                      active
                        ? "border-ink bg-ink text-[#FFFEF6] shadow-sm"
                        : "border-line bg-sunken/70 text-ink hover:border-line-strong hover:bg-sunken",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold">{v.label}</span>
                      <span
                        className={cn(
                          "size-2.5 rounded-full transition-transform group-hover:scale-110",
                          active && "ring-2 ring-white/40",
                        )}
                        style={{ backgroundColor: v.swatch }}
                        aria-hidden
                      />
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 text-[12px]",
                        active ? "text-[#FFFEF6]/70" : "text-ink-muted",
                      )}
                    >
                      {v.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <Link
              href={`/events?type=${vibe.key}`}
              className="ui-press ui-sheen flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lavender px-5 text-[15.5px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover"
            >
              Explore {vibe.label.toLowerCase()}
              <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
            </Link>
            <div className="mt-3.5 flex items-center justify-between text-[13.5px]">
              <Link
                href="/events"
                className="font-semibold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                See all events
              </Link>
              <Link
                href="/host"
                className="font-semibold text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                Host your own
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
