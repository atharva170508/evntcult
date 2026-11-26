"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, QrCode, ScanFace, ShieldCheck, Zap } from "lucide-react";
import {
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { BrandMark } from "@/components/site/Brand";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { TextScramble } from "@/components/shadcn/text-scramble";

const PASSES = [
  {
    id: "left",
    title: "HackNight '26",
    kind: "TECH · TEAM PASS",
    serial: "NEON-FALCON-0018",
    meta: "Fri · 6:30 PM · Main Auditorium",
    bg: "linear-gradient(145deg, #0D1B44 0%, #1E3FA8 56%, #0B122A 100%)",
    accent: "#93C5FD",
  },
  {
    id: "center",
    title: "Sunset Sessions",
    kind: "MAINSTAGE · VIP ENTRY",
    serial: "VELVET-COMET-0042",
    meta: "Sat · 8:00 PM · Campus Amphitheatre",
    bg: "linear-gradient(145deg, #27103B 0%, #7C1D4E 52%, #141110 100%)",
    accent: "#F0D7FF",
  },
  {
    id: "right",
    title: "Acoustic Courtyard",
    kind: "CULTURAL · GENERAL",
    serial: "CRIMSON-ECHO-0091",
    meta: "Sun · 7:00 PM · Central Quad",
    bg: "linear-gradient(145deg, #3B1219 0%, #A91F3D 54%, #1A090C 100%)",
    accent: "#FDA4AF",
  },
] as const;

const FLOATING_SPECS = [
  { icon: Zap, label: "0.4s offline scan", pos: "left-[4%] top-[24%] lg:left-[8%]" },
  { icon: QrCode, label: "Auto .ics calendar sync", pos: "right-[4%] top-[22%] lg:right-[8%]" },
  { icon: ScanFace, label: "On-device Face ID vault", pos: "left-[5%] bottom-[16%] lg:left-[10%]" },
  { icon: ShieldCheck, label: "0% direct UPI fees", pos: "right-[5%] bottom-[16%] lg:right-[10%]" },
] as const;

/**
 * 190vh Sticky Scroll-Scrubbed 3D Pass Constellation:
 * As you scroll, 3 holographic EvntCult passes fan outward in 3D space while
 * dual opposing kinetic typography ribbons scrub across the darkroom backdrop
 * and floating product callout chips rise into frame.
 */
export function ScrollPassStory() {
  const reduced = !!useReducedMotion();
  const runwayRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    mass: 0.35,
  });
  const p = reduced ? scrollYProgress : smooth;

  // Interactive pointer 3D tilt on the fanned pass cluster
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 90, damping: 20 });
  const rotX = useSpring(useTransform(my, [-1, 1], [6, -6]), { stiffness: 90, damping: 20 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // Opposing scroll-scrubbed kinetic marquee ribbons
  const ribbonTopX = useTransform(p, [0, 1], ["8%", "-18%"]);
  const ribbonBotX = useTransform(p, [0, 1], ["-18%", "8%"]);

  // 3D Fan-out transforms for Left, Center, Right passes
  const leftX = useTransform(p, [0.18, 0.56], ["0%", "-64%"]);
  const leftY = useTransform(p, [0.18, 0.56], [40, 18]);
  const leftRot = useTransform(p, [0.18, 0.56], [0, -13]);
  const leftScale = useTransform(p, [0.18, 0.56], [0.84, 0.92]);
  const leftOp = useTransform(p, [0.12, 0.36], [0, 0.94]);

  const rightX = useTransform(p, [0.18, 0.56], ["0%", "64%"]);
  const rightY = useTransform(p, [0.18, 0.56], [40, 18]);
  const rightRot = useTransform(p, [0.18, 0.56], [0, 13]);
  const rightScale = useTransform(p, [0.18, 0.56], [0.84, 0.92]);
  const rightOp = useTransform(p, [0.12, 0.36], [0, 0.94]);

  const centerY = useTransform(p, [0.14, 0.52], [90, -10]);
  const centerScale = useTransform(p, [0.14, 0.52], [0.88, 1.04]);
  const centerOp = useTransform(p, [0.1, 0.3], [0, 1]);

  // Rising floating feature chips
  const chipsY = useTransform(p, [0.28, 0.58], [60, 0]);
  const chipsOp = useTransform(p, [0.28, 0.52], [0, 1]);

  // Header & CTA reveal
  const headY = useTransform(p, [0.12, 0.38], [50, 0]);
  const headOp = useTransform(p, [0.12, 0.34], [0, 1]);

  return (
    <section
      ref={runwayRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-label="Interactive pass constellation"
      className="relative h-[175vh] w-full border-t border-white/10 bg-[#121110]/55 text-[#EDE3DA] backdrop-blur-[2px]"
    >
      <div className="sticky top-0 flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-gutter">
        {/* Ambient radial spotlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(680px circle at 50% 52%, rgba(227,38,79,0.16), rgba(240,215,255,0.08) 42%, transparent 72%)",
          }}
        />

        {/* Opposing Scroll-Scrubbed Kinetic Typography Ribbons */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[24%] select-none overflow-hidden opacity-[0.06]"
        >
          <m.p
            style={{ x: ribbonTopX }}
            className="whitespace-nowrap font-display text-[clamp(64px,10vw,148px)] font-semibold uppercase leading-none tracking-[-0.03em] text-[#EDE3DA]"
          >
            ONE PASS · ZERO FEES · OFFLINE GATES · PHOTO VAULT · ONE PASS · ZERO FEES ·
          </m.p>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[18%] select-none overflow-hidden opacity-[0.055]"
        >
          <m.p
            style={{ x: ribbonBotX }}
            className="whitespace-nowrap font-display text-[clamp(64px,10vw,148px)] font-semibold italic uppercase leading-none tracking-[-0.03em] text-[#F0D7FF]"
          >
            MAINSTAGE · HACKATHONS · WORKSHOPS · FESTS · MAINSTAGE · HACKATHONS ·
          </m.p>
        </div>

        {/* Section Heading */}
        <m.div
          style={reduced ? undefined : { y: headY, opacity: headOp }}
          className="relative z-20 mb-8 text-center md:mb-10"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#F0D7FF]/85">
            THE PASS CONSTELLATION
          </p>
          <h2 className="mt-2 font-display text-[clamp(34px,4.5vw,60px)] leading-[0.96] tracking-[-0.03em] text-[#EDE3DA]">
            Every ticket, <em className="italic text-[#F0D7FF]">crafted like an artifact.</em>
          </h2>
        </m.div>

        {/* 3D Fanned Pass Constellation */}
        <div
          className="relative z-20 flex h-[280px] w-full max-w-[920px] items-center justify-center sm:h-[310px]"
          style={{ perspective: 1400 }}
        >
          <m.div
            style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* Left Fanned Pass */}
            <m.div
              style={
                reduced
                  ? { x: "-52%", rotate: -10 }
                  : { x: leftX, y: leftY, rotate: leftRot, scale: leftScale, opacity: leftOp }
              }
              className="absolute hidden w-[290px] overflow-hidden rounded-[22px] border border-white/15 p-5 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)] sm:block md:w-[320px]"
            >
              <div className="absolute inset-0" style={{ background: PASSES[0].bg }} />
              <div className="relative z-10 flex h-[215px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <BrandMark tone="white" className="h-4 w-5" />
                  <span className="font-mono text-[10px] tracking-[0.08em] text-[#93C5FD]">
                    {PASSES[0].kind}
                  </span>
                </div>
                <div>
                  <p className="font-display text-[28px] leading-none text-[#FFFEF6]">{PASSES[0].title}</p>
                  <p className="mt-1.5 text-[12px] text-white/70">{PASSES[0].meta}</p>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-white/20 pt-3 font-mono text-[10.5px] text-white/80">
                  <span>{PASSES[0].serial}</span>
                  <span>ADMIT ONE</span>
                </div>
              </div>
            </m.div>

            {/* Right Fanned Pass */}
            <m.div
              style={
                reduced
                  ? { x: "52%", rotate: 10 }
                  : { x: rightX, y: rightY, rotate: rightRot, scale: rightScale, opacity: rightOp }
              }
              className="absolute hidden w-[290px] overflow-hidden rounded-[22px] border border-white/15 p-5 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)] sm:block md:w-[320px]"
            >
              <div className="absolute inset-0" style={{ background: PASSES[2].bg }} />
              <div className="relative z-10 flex h-[215px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <BrandMark tone="white" className="h-4 w-5" />
                  <span className="font-mono text-[10px] tracking-[0.08em] text-[#FDA4AF]">
                    {PASSES[2].kind}
                  </span>
                </div>
                <div>
                  <p className="font-display text-[28px] leading-none text-[#FFFEF6]">{PASSES[2].title}</p>
                  <p className="mt-1.5 text-[12px] text-white/70">{PASSES[2].meta}</p>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-white/20 pt-3 font-mono text-[10.5px] text-white/80">
                  <span>{PASSES[2].serial}</span>
                  <span>ADMIT ONE</span>
                </div>
              </div>
            </m.div>

            {/* Center Hero Pass with BorderTrail + TextScramble */}
            <m.div
              style={
                reduced
                  ? undefined
                  : { y: centerY, scale: centerScale, opacity: centerOp }
              }
              className="relative z-20 w-[310px] overflow-hidden rounded-[24px] border border-white/25 p-6 shadow-[0_38px_80px_-24px_rgba(0,0,0,0.95)] md:w-[360px]"
            >
              <div className="absolute inset-0" style={{ background: PASSES[1].bg }} />
              <BorderTrail
                size={76}
                className="z-20 bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent"
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              />
              <div className="relative z-10 flex h-[232px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrandMark tone="white" className="h-4 w-5" />
                    <span className="font-mono text-[10.5px] tracking-[0.12em] text-white/75">
                      EVNTCULT
                    </span>
                  </div>
                  <span className="rounded-full bg-[#F0D7FF]/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#F0D7FF]">
                    {PASSES[1].kind}
                  </span>
                </div>
                <div>
                  <p className="font-display text-[34px] leading-[0.95] text-[#FFFEF6]">
                    {PASSES[1].title}
                  </p>
                  <p className="mt-2 text-[13px] text-white/75">{PASSES[1].meta}</p>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-white/25 pt-3.5">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#F0D7FF]">
                    {reduced ? PASSES[1].serial : <TextScramble>{PASSES[1].serial}</TextScramble>}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#5EE0A8]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5EE0A8]">
                    OFFLINE QR ✓
                  </span>
                </div>
              </div>
            </m.div>
          </m.div>
        </div>

        {/* 4 Floating Callout Chips Rising Around the Constellation (desktop) */}
        {FLOATING_SPECS.map(({ icon: Icon, label, pos }) => (
          <m.div
            key={label}
            style={reduced ? undefined : { y: chipsY, opacity: chipsOp }}
            className={`pointer-events-none absolute z-20 hidden items-center gap-2 rounded-full border border-white/15 bg-[#1A1816]/85 px-3.5 py-2 text-[12px] font-medium text-[#EDE3DA] shadow-lg backdrop-blur-md xl:inline-flex ${pos}`}
          >
            <Icon className="size-3.5 text-[#F0D7FF]" aria-hidden />
            <span>{label}</span>
          </m.div>
        ))}

        {/* Bottom CTA */}
        <m.div
          style={reduced ? undefined : { y: chipsY, opacity: chipsOp }}
          className="relative z-20 mt-8"
        >
          <Link
            href="/signin?mode=signup"
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 text-[13.5px] font-semibold text-[#EDE3DA] backdrop-blur-md transition-colors hover:bg-[#F0D7FF] hover:text-[#121110]"
          >
            Claim your first pass
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </m.div>
      </div>
    </section>
  );
}
