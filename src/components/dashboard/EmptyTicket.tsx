"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowRight, RefreshCw, RotateCw, QrCode, Images, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/site/Brand";
import { DashboardGreeting } from "./DashboardGreeting";
import { EASE } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

const VIBES = [
  {
    key: "PARTY",
    label: "Nights out",
    blurb: "Rooftop DJ sets, acoustic nights, and afterhours campus socials.",
    swatch: "#6D3DF5",
    tint: "rgba(109, 61, 245, 0.08)",
    cardBg: "linear-gradient(145deg, #211047 0%, #4E26B3 58%, #160A30 100%)",
    names: ["Sunset Sessions", "Rooftop Social", "Afterhours Vinyl"],
    venues: ["Riverside Lawn", "Terrace Deck", "Amphitheatre"],
    slot: "Sat · 8:00 pm",
    tag: "Entry + QR",
    callSign: "Velvet Comet",
  },
  {
    key: "TECH",
    label: "Tech",
    blurb: "24-hour hackathons, AI build nights, founder talks, and live demos.",
    swatch: "#2346A8",
    tint: "rgba(35, 70, 168, 0.08)",
    cardBg: "linear-gradient(145deg, #0B1940 0%, #1F44A8 58%, #091330 100%)",
    names: ["Hack Night", "Build with AI", "Campus Demo Day"],
    venues: ["Main Auditorium", "Innovation Lab", "Seminar Hall B"],
    slot: "Fri · 6:30 pm",
    tag: "Team pass",
    callSign: "Neon Falcon",
  },
  {
    key: "SPORTS",
    label: "Sports",
    blurb: "Floodlit box cricket, midnight 5Ks, 5-a-side turf leagues, and badminton.",
    swatch: "#D6652A",
    tint: "rgba(214, 101, 42, 0.09)",
    cardBg: "linear-gradient(145deg, #3B1707 0%, #BD4E19 58%, #240D04 100%)",
    names: ["Box Cricket League", "Midnight 5K Run", "5-a-side Friday"],
    venues: ["North Turf", "Main Track", "East Court"],
    slot: "Sun · 6:00 am",
    tag: "Player pass",
    callSign: "Solar Phoenix",
  },
  {
    key: "CULTURAL",
    label: "Culture",
    blurb: "Garba nights, open mic poetry, theatre showcases, and annual fests.",
    swatch: "#C7457A",
    tint: "rgba(199, 69, 122, 0.08)",
    cardBg: "linear-gradient(145deg, #3E0F24 0%, #B32E65 58%, #260816 100%)",
    names: ["Garba Night", "Open Mic Poetry", "Acoustic Courtyard"],
    venues: ["Central Quad", "OAT Steps", "Heritage Hall"],
    slot: "Sat · 7:00 pm",
    tag: "General entry",
    callSign: "Crimson Echo",
  },
  {
    key: "WORKSHOP",
    label: "Workshops",
    blurb: "Hands-on design sprints, film photo walks, pottery, and maker labs.",
    swatch: "#11796D",
    tint: "rgba(17, 121, 109, 0.08)",
    cardBg: "linear-gradient(145deg, #072B27 0%, #147065 58%, #041C19 100%)",
    names: ["Film Photo Walk", "Figma in 90 Mins", "Pottery Sunday"],
    venues: ["Design Studio", "Botanical Gate", "Craft Room 4"],
    slot: "Sun · 11:00 am",
    tag: "Seat + cert",
    callSign: "Jade Prism",
  },
  {
    key: "GAMING",
    label: "Gaming",
    blurb: "LAN Valorant cups, retro arcade nights, FIFA brackets, and blitz chess.",
    swatch: "#E3264F",
    tint: "rgba(227, 38, 79, 0.08)",
    cardBg: "linear-gradient(145deg, #3A0A15 0%, #BA1B3E 58%, #21050B 100%)",
    names: ["Valorant Cup", "Retro Arcade Night", "Blitz Chess Open"],
    venues: ["Esports Arena", "Student Lounge", "Library Lawn"],
    slot: "Fri · 9:00 pm",
    tag: "Bracket slot",
    callSign: "Sonic Nova",
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

/** Deterministic crisp 9x9 QR matrix for the back of the pass. */
function QrMatrix({ seed }: { seed: number }) {
  const cells: boolean[] = [];
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
      const ring = finder && !((x % 6 === 1 || x === 7) && (y % 6 === 1 || y === 7));
      cells.push(
        finder
          ? ring || (x % 6 === 1 && y % 6 === 1) || (x === 7 && y === 1) || (x === 1 && y === 7)
          : ((x * 7 + y * 13 + seed * 5) % 5) < 2,
      );
    }
  }
  return (
    <div aria-hidden className="grid size-[62px] shrink-0 grid-cols-9 gap-[1.5px] rounded-lg bg-[#FFFEF6] p-1.5 ring-1 ring-ink/10">
      {cells.map((on, k) => (
        <span key={k} className={on ? "rounded-[0.5px] bg-[#1A1A1A]" : ""} />
      ))}
    </div>
  );
}

function MiniBarcode() {
  const bars = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2];
  return (
    <div aria-hidden className="flex h-6 items-stretch gap-[2px] opacity-80">
      {bars.map((w, idx) => (
        <span key={idx} className="rounded-[0.5px] bg-[#FFFEF6]" style={{ width: `${w}px` }} />
      ))}
    </div>
  );
}

/**
 * Signed-in Home hero when the user doesn't have an upcoming pass yet.
 * Full-width warm editorial canvas (zero nested boxes) with a tactile fanned 3-pass Apple Wallet
 * stack on the right, live cursor-tracking foil sheen, 3D flip, and instant vibe switching.
 */
export function EmptyTicket({ name, dateLine }: { name: string; dateLine: string }) {
  const reduce = !!useReducedMotion();
  const [vibeIdx, setVibeIdx] = useState(1);
  const [titleIdx, setTitleIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [glare, setGlare] = useState({ x: 50, y: 30, on: false, rx: 0, ry: 0 });

  const vibe = VIBES[vibeIdx];
  const nextVibe = VIBES[(vibeIdx + 1) % VIBES.length];
  const prevVibe = VIBES[(vibeIdx + VIBES.length - 1) % VIBES.length];
  const eventTitle = vibe.names[titleIdx % vibe.names.length];
  const venue = vibe.venues[titleIdx % vibe.venues.length];
  const firstName = name.trim().split(/\s+/)[0] || name;

  const selectVibe = (idx: number) => {
    setVibeIdx(idx);
    setTitleIdx(0);
    setFlipped(false);
  };

  const onCardMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = ((px - 50) / 50) * 7;
    const rx = ((50 - py) / 50) * 6;
    setGlare({ x: px, y: py, on: true, rx, ry });
  };

  const onCardLeave = () => setGlare((g) => ({ ...g, on: false, rx: 0, ry: 0 }));

  return (
    <section aria-labelledby="home-greeting" className="pt-6 md:pt-10">
      <DashboardGreeting
        name={name}
        dateLine={dateLine}
        subtitle="Pick a vibe below to preview your first pass."
      />

      {/* Single unified warm editorial stage — no nested cards */}
      <div
        className="relative overflow-hidden rounded-[28px] border border-line-strong bg-sunken/75 transition-colors duration-500"
        style={{
          backgroundImage: `radial-gradient(620px circle at 82% 28%, ${vibe.tint}, transparent 68%)`,
        }}
      >
        <div className="grid items-center gap-10 p-6 sm:p-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:p-11">
          {/* LEFT: Editorial copy, spring vibe selector, direct actions */}
          <div className="relative z-10 flex flex-col">
            <h2 className="max-w-[16ch] font-display text-[clamp(32px,3.6vw,48px)] leading-[1.02] tracking-[-0.025em] text-ink">
              Your first pass is waiting for a plan.
            </h2>
            <p className="mt-3 max-w-[44ch] text-[15.5px] leading-relaxed text-ink-2">
              {vibe.blurb}
            </p>

            {/* Spring-animated tactile vibe pill bar */}
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Pick a campus vibe">
              {VIBES.map((v, idx) => {
                const active = idx === vibeIdx;
                return (
                  <button
                    key={v.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectVibe(idx)}
                    className={cn(
                      "relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors",
                      active ? "text-[#FFFEF6]" : "bg-surface/90 text-ink-2 ring-1 ring-line hover:text-ink",
                    )}
                  >
                    {active && (
                      <m.span
                        layoutId="dashboard-vibe-pill"
                        transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-ink"
                      />
                    )}
                    <span
                      className="relative z-10 size-2 rounded-full"
                      style={{ backgroundColor: v.swatch }}
                      aria-hidden
                    />
                    <span className="relative z-10">{v.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Primary + secondary actions */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href={`/events?type=${vibe.key}`}
                className="ui-press ui-sheen inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[15.5px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover"
              >
                Explore {vibe.label.toLowerCase()}
                <ArrowRight className="size-4" strokeWidth={2.3} aria-hidden />
              </Link>
              <Link
                href="/events"
                className="text-[14.5px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] transition-colors hover:decoration-ink"
              >
                Browse all events
              </Link>
              <Link
                href="/host"
                className="text-[14.5px] font-semibold text-ink-2 underline decoration-line-strong underline-offset-[6px] transition-colors hover:text-ink hover:decoration-ink"
              >
                Host your own
              </Link>
            </div>
          </div>

          {/* RIGHT: Tactile Fanned 3-Pass Stack floating freely on the stage */}
          <div className="relative flex flex-col items-center">
            <div className="relative mx-auto w-full max-w-[400px] pt-5" style={{ perspective: 1200 }}>
              {/* Back-left peeking pass (click to switch to previous vibe) */}
              <button
                type="button"
                aria-label={`Preview ${prevVibe.label} pass`}
                onClick={() => selectVibe((vibeIdx + VIBES.length - 1) % VIBES.length)}
                style={{ background: prevVibe.cardBg }}
                className="pointer-events-auto absolute inset-x-4 top-0 h-[120px] -rotate-[4.5deg] cursor-pointer rounded-[22px] p-4 text-left text-[#FFFEF6]/80 opacity-85 shadow-lg ring-1 ring-white/15 transition-transform duration-300 hover:-translate-y-2 hover:-rotate-[6deg] hover:opacity-100"
              >
                <span className="font-mono text-[10px] tracking-[0.06em] opacity-80">{prevVibe.label}</span>
              </button>

              {/* Back-right peeking pass (click to switch to next vibe) */}
              <button
                type="button"
                aria-label={`Preview ${nextVibe.label} pass`}
                onClick={() => selectVibe((vibeIdx + 1) % VIBES.length)}
                style={{ background: nextVibe.cardBg }}
                className="pointer-events-auto absolute inset-x-4 top-2 h-[120px] rotate-[4deg] cursor-pointer rounded-[22px] p-4 text-right text-[#FFFEF6]/85 opacity-90 shadow-lg ring-1 ring-white/15 transition-transform duration-300 hover:-translate-y-2 hover:rotate-[5.5deg] hover:opacity-100"
              >
                <span className="font-mono text-[10px] tracking-[0.06em] opacity-85">{nextVibe.label}</span>
              </button>

              {/* Front active 3D Pass with cursor-tracking foil glare */}
              <div
                onPointerMove={onCardMove}
                onPointerLeave={onCardLeave}
                className="relative z-10 mt-6"
                style={{ perspective: 1200 }}
              >
                <m.div
                  animate={{
                    rotateY: flipped ? 180 : glare.ry,
                    rotateX: flipped ? 0 : glare.rx,
                  }}
                  transition={
                    reduce
                      ? { duration: 0.01 }
                      : { type: "spring", stiffness: 210, damping: 22 }
                  }
                  style={{ transformStyle: "preserve-3d" }}
                  className="relative min-h-[262px] w-full"
                >
                  {/* FRONT FACE */}
                  <div
                    style={{ backfaceVisibility: "hidden", background: vibe.cardBg }}
                    className="relative flex min-h-[262px] flex-col justify-between overflow-hidden rounded-[24px] p-6 text-[#FFFEF6] shadow-[0_32px_60px_-24px_rgba(20,14,6,0.58),inset_0_1px_0_rgba(255,255,255,0.24)] ring-1 ring-black/15"
                  >
                    {/* Cursor-tracking holographic foil sheen */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                      style={{
                        opacity: glare.on ? 1 : 0,
                        background: `radial-gradient(280px circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.24), transparent 65%)`,
                      }}
                    />

                    {/* Subtle dot matrix texture */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage: "radial-gradient(#FFFEF6 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    />

                    <div className="relative flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BrandMark tone="white" className="size-4" />
                        <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-[#FFFEF6]/80">
                          EVNTCULT
                        </span>
                      </div>
                      <span className="rounded-md bg-black/25 px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#FFFEF6]/95 backdrop-blur-sm">
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
                          transition={{ duration: 0.22, ease: EASE }}
                        >
                          <p className="font-display text-[clamp(30px,3.6vw,40px)] leading-[0.98] tracking-[-0.025em] text-[#FFFEF6]">
                            {eventTitle}
                          </p>
                          <p className="mt-1.5 text-[13.5px] font-medium text-[#FFFEF6]/80">
                            {venue} · {vibe.slot}
                          </p>
                        </m.div>
                      </AnimatePresence>
                    </div>

                    {/* Perforated tear divider with side notches */}
                    <div className="relative -mx-6 my-1 flex items-center">
                      <span className="size-3.5 -translate-x-1/2 rounded-full bg-sunken" aria-hidden />
                      <div className="flex-1 border-t border-dashed border-white/25" />
                      <span className="size-3.5 translate-x-1/2 rounded-full bg-sunken" aria-hidden />
                    </div>

                    <div className="relative mt-2 flex items-end justify-between gap-3">
                      <dl className="flex gap-5 text-[11.5px]">
                        <div>
                          <dt className="text-[#FFFEF6]/60">Admit one</dt>
                          <dd className="mt-0.5 max-w-[125px] truncate text-[14px] font-semibold text-[#FFFEF6]">
                            {name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[#FFFEF6]/60">Call sign</dt>
                          <dd className="mt-0.5 text-[13.5px] font-semibold text-[#FFFEF6]">
                            {vibe.callSign}
                          </dd>
                        </div>
                      </dl>
                      <MiniBarcode />
                    </div>
                  </div>

                  {/* BACK FACE — Warm cream paper back with real geometric QR */}
                  <div
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    className="paper-keep absolute inset-0 flex flex-col justify-between rounded-[24px] bg-[#FFFEF6] p-6 text-[#1A1A1A] shadow-[0_32px_60px_-24px_rgba(20,14,6,0.45)] ring-1 ring-black/15"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#D8D1BE] pb-3.5">
                      <div>
                        <p className="font-display text-[22px] leading-tight text-[#1A1A1A]">
                          One pass, zero hassle.
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-[#6A6A6A]">
                          Issued to {firstName} on claim
                        </p>
                      </div>
                      <QrMatrix seed={vibeIdx * 7 + titleIdx + 1} />
                    </div>

                    <ul className="my-3 space-y-2 text-[13px] text-[#2A2A2A]">
                      <li className="flex items-center gap-2.5">
                        <QrCode className="size-4 shrink-0 text-[#1A1A1A]" aria-hidden />
                        <span>Offline QR scans at the gate in under a second</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Images className="size-4 shrink-0 text-[#1A1A1A]" aria-hidden />
                        <span>Auto Photo Vault finds your event photos via Face ID</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="size-4 shrink-0 text-[#1A1A1A]" aria-hidden />
                        <span>Verified certificate lands straight in your profile</span>
                      </li>
                    </ul>

                    <div className="flex items-center justify-between font-mono text-[10.5px] text-[#6A6A6A]">
                      <span>EVNTCULT · CAMPUS PASS</span>
                      <span>READY</span>
                    </div>
                  </div>
                </m.div>
              </div>
            </div>

            {/* Quiet tactile controls right under the pass */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFlipped(false);
                  setTitleIdx((n) => n + 1);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[12.5px] font-semibold text-ink ring-1 ring-line transition-colors hover:bg-canvas"
              >
                <RefreshCw className="size-3 text-ink-muted" aria-hidden />
                Shuffle idea
              </button>
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[12.5px] font-semibold text-ink ring-1 ring-line transition-colors hover:bg-canvas"
              >
                <RotateCw className="size-3 text-ink-muted" aria-hidden />
                {flipped ? "Show front" : "Flip pass"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
