"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Download, ScanFace, ShieldCheck } from "lucide-react";
import { AnimatePresence, m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { InView } from "@/components/shadcn/in-view";
import { GlowEffect } from "@/components/shadcn/glow-effect";
import { SlidingNumber } from "@/components/shadcn/sliding-number";
import { COUT } from "@/lib/motion-curves";

const FRAMES = [
  { id: "v0", frame: "EXP 01", accent: "orange", match: false },
  { id: "v1", frame: "EXP 02", accent: "violet", match: true, score: 99 },
  { id: "v2", frame: "EXP 03", accent: "teal", match: false },
  { id: "v3", frame: "EXP 04", accent: "pink", match: true, score: 98 },
  { id: "v4", frame: "EXP 05", accent: "blue", match: false },
  { id: "v5", frame: "EXP 06", accent: "green", match: true, score: 97 },
  { id: "v6", frame: "EXP 07", accent: "red", match: false },
  { id: "v7", frame: "EXP 08", accent: "violet", match: true, score: 99 },
  { id: "v8", frame: "EXP 09", accent: "orange", match: false },
] as const;

/**
 * Full-bleed Obsidian Darkroom Light-Table showcase for EvntCult's Photo Vault USP.
 * Features a glowing Face-Match light-table scan sweep across all 9 film frames,
 * GlowEffect bloom on matched frames, and SlidingNumber confidence counters.
 */
export function VaultSpotlight() {
  const reduced = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"idle" | "scanning" | "matched">("idle");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 95, damping: 24 });
  const sheetRotX = useTransform(smooth, [0, 1], [12, 0]);
  const sheetScale = useTransform(smooth, [0, 1], [0.94, 1]);

  const runMatch = () => {
    if (phase === "scanning") return;
    if (phase === "matched") {
      setPhase("idle");
      return;
    }
    setPhase("scanning");
    window.setTimeout(() => setPhase("matched"), 1150);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="vault-usp-h"
      className="relative z-10 w-full border-t border-white/10 bg-[#121110]/60 py-20 text-[#EDE3DA] backdrop-blur-[2px] md:py-28"
    >
      <div className="mx-auto max-w-[1360px] px-gutter">
        <InView
          once
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.7, ease: COUT }}
          className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16"
        >
          {/* Left editorial darkroom column */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F0D7FF]/80">
              02 · Photo Vault
            </p>
            <h2
              id="vault-usp-h"
              className="mt-3 font-display text-[clamp(44px,5.4vw,72px)] leading-[0.92] tracking-[-0.03em] text-[#EDE3DA]"
            >
              One selfie at sign-in.{" "}
              <em className="italic text-[#F0D7FF]">Every photo you&apos;re in.</em>
            </h2>
            <p className="mt-6 max-w-[42ch] text-[16.5px] leading-relaxed text-[#EDE3DA]/70">
              Skip digging through 500-photo Drive folders the morning after an event. Your browser
              converts one selfie into numbers on your device, discards the photo, and gathers
              every shot of you in your Photo Vault automatically.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-6 border-y border-white/12 py-5 text-[13.5px]">
              <div>
                <dt className="text-[#EDE3DA]/50">Processing</dt>
                <dd className="mt-1 font-semibold text-[#EDE3DA]">On your phone</dd>
              </div>
              <div>
                <dt className="text-[#EDE3DA]/50">Selfie stored</dt>
                <dd className="mt-1 font-semibold text-[#EDE3DA]">Never</dd>
              </div>
              <div>
                <dt className="text-[#EDE3DA]/50">Delivery</dt>
                <dd className="mt-1 font-semibold text-[#EDE3DA]">Full HD</dd>
              </div>
            </dl>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Magnetic>
                <Link
                  href="/signin?mode=signup"
                  className="ui-press ui-sheen inline-flex h-12 items-center gap-2 rounded-[14px] bg-[#F0D7FF] px-6 text-[15.5px] font-semibold text-[#121110] transition-colors hover:bg-white"
                >
                  <ScanFace className="size-4" strokeWidth={2.1} aria-hidden />
                  Set up Photo Vault
                </Link>
              </Magnetic>
              <span className="inline-flex items-center gap-1.5 text-[13.5px] text-[#EDE3DA]/60">
                <ShieldCheck className="size-4 text-[#5EE0A8]" aria-hidden />
                Clear Face ID anytime
              </span>
            </div>
          </div>

          {/* Right interactive darkroom contact sheet with scroll-linked 3D tilt-in */}
          <div className="relative" style={{ perspective: 1200 }}>
            <m.div
              style={reduced ? undefined : { rotateX: sheetRotX, scale: sheetScale }}
              className="relative will-change-transform"
            >
            {phase === "matched" && (
              <GlowEffect
                colors={["#F0D7FF", "#E3264F", "#5D3827", "#F0D7FF"]}
                mode="breathe"
                blur="strong"
                className="pointer-events-none -inset-1 rounded-[28px] opacity-35"
              />
            )}
            <div
              data-sample="true"
              className="relative rounded-[24px] border border-white/15 bg-[#1A1816]/80 p-6 shadow-[0_32px_70px_-28px_rgba(0,0,0,0.85)] backdrop-blur-xl md:p-8"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#EDE3DA]/45">
                    Darkroom contact sheet
                  </p>
                  <p className="mt-1 text-[14.5px] font-medium text-[#EDE3DA]" role="status">
                    {phase === "idle"
                      ? "9 frames from an event album"
                      : phase === "scanning"
                        ? "Sweeping 128-d face vectors…"
                        : "4 photos of you matched"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runMatch}
                  disabled={phase === "scanning"}
                  className="ui-press inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#F0D7FF] px-4 text-[13.5px] font-semibold text-[#121110] transition-colors hover:bg-white disabled:opacity-60"
                >
                  {phase === "matched" ? "Show all" : phase === "scanning" ? "Scanning…" : "Try match"}
                </button>
              </div>

              <div className="relative mt-6 grid grid-cols-3 gap-3 overflow-hidden rounded-2xl p-1">
                {FRAMES.map((item, idx) => {
                  const isHit = phase === "matched" && item.match;
                  const isDim = phase === "matched" && !item.match;
                  return (
                    <m.div
                      key={item.id}
                      animate={{
                        scale: isDim ? 0.93 : isHit ? 1.02 : 1,
                        opacity: isDim ? 0.18 : 1,
                      }}
                      transition={{ duration: 0.4, ease: COUT, delay: phase === "matched" ? idx * 0.03 : 0 }}
                      className={cn(
                        "group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/10",
                        isHit && "ring-2 ring-[#F0D7FF] shadow-[0_14px_30px_-8px_rgba(240,215,255,0.28)]",
                      )}
                      aria-hidden
                    >
                      <div className="size-full transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105">
                        <EventArt accent={item.accent} seed={`vault-${item.id}`} scrim={false} flat />
                      </div>
                      <span className="absolute bottom-1.5 left-2 font-mono text-[9.5px] tracking-[0.06em] text-white/80">
                        {item.frame}
                      </span>
                      {isHit && "score" in item && (
                        <span className="paper-keep absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-white/95 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#121110] shadow-sm">
                          <Check className="size-2.5 text-[#16A34A]" strokeWidth={3} />
                          <SlidingNumber value={item.score} />%
                        </span>
                      )}
                    </m.div>
                  );
                })}

                {/* Glowing Darkroom Face-Match Scan Sweep */}
                <AnimatePresence>
                  {phase === "scanning" && (
                    <m.div
                      key="darkroom-sweep"
                      aria-hidden
                      initial={{ top: "-8%", opacity: 0 }}
                      animate={{ top: ["-8%", "104%"], opacity: [0, 1, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, ease: "easeInOut" }}
                      className="pointer-events-none absolute inset-x-0 z-20 h-[3px] bg-[#F0D7FF] shadow-[0_0_24px_6px_rgba(240,215,255,0.85),0_0_40px_10px_rgba(227,38,79,0.5)]"
                    >
                      <span className="absolute inset-x-0 -top-14 h-28 bg-gradient-to-b from-[#F0D7FF]/0 via-[#F0D7FF]/25 to-[#F0D7FF]/0" />
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[12.5px] text-[#EDE3DA]/55">
                <span>Visible only to registered attendees</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#F0D7FF]">
                  {phase === "matched" ? (
                    <>
                      <Download className="size-3.5" aria-hidden />
                      <SlidingNumber value={4} /> HD photos ready
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-[#EDE3DA]/45">ON-DEVICE · 0 CLOUD FACES</span>
                  )}
                </span>
              </div>
            </div>
            </m.div>
          </div>
        </InView>
      </div>
    </section>
  );
}
