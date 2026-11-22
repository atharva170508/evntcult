"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { EventArt } from "@/components/ui/EventArt";
import { BrandLogo, BrandMark } from "@/components/site/Brand";
import { EASE } from "@/components/motion/MotionProvider";
import { svgSrc } from "@/lib/svg-src";

export interface PrintedPass {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  holder: string;
  passCode: string;
  qrSvg: string | null;
  amountLabel: string; // "Free" or "₹299"
  /** What the payment line says under the total. */
  payNote: string | null;
  accent: string;
  seed: string;
}

type Phase = "confirm" | "print" | "done";

const STATUS: Record<Phase, string> = {
  confirm: "Confirming your seat",
  print: "Printing your pass",
  done: "You're in",
};

/**
 * The moment after registering (or paying), in EvntCult's own colours: a printer with the
 * logo on its face feeds out your real pass in short bursts, its light goes from red to green,
 * then brand-colour confetti. One orchestrated sequence, ~3.5 s, skipped under reduced motion.
 */
export function PassPrinter({ pass, onClose }: { pass: PrintedPass; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduce ? "done" : "confirm");

  useEffect(() => {
    if (reduce) return;
    const a = setTimeout(() => setPhase("print"), 900);
    const b = setTimeout(() => setPhase("done"), 900 + PRINT_MS + 150);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduce]);

  return (
    <ModalDialog label="Your pass" onClose={onClose}>
      <m.div className="absolute inset-0 overflow-y-auto bg-canvas text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {/* Soft lavender light behind the printer */}

        <div className="relative mx-auto flex min-h-full w-full max-w-[400px] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-11 place-items-center rounded-full text-ink-2 transition-colors duration-fast hover:bg-sunken hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {/* Printer */}
          <m.div
            className="relative z-10 mt-4"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={phase === "print" && !reduce ? { opacity: 1, y: 0, x: [0, -0.6, 0.6, -0.4, 0.4, 0] } : { opacity: 1, y: 0, x: 0 }}
            transition={phase === "print" ? { x: { duration: 0.18, repeat: Infinity, repeatType: "loop" }, default: { duration: 0.28, ease: EASE } } : { duration: 0.28, ease: EASE }}
          >
            <div className="rounded-[24px] bg-[#1A1A1A] p-2 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_30px_60px_-24px_rgba(26,26,26,0.55)]">
              {/* Face: logo and the status light */}
              <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
                <BrandLogo tone="white" className="text-[13px] opacity-90" />
                <span className="flex items-center gap-2 text-[11px] font-medium text-white/50">
                  {phase === "done" ? "Ready" : phase === "print" ? "Printing" : "Connecting"}
                  <span className="relative grid size-2.5 place-items-center" aria-hidden>
                    <span className={`absolute inset-0 rounded-full ${phase === "done" ? "bg-[#3DDC97]" : "bg-[#E3264F]"}`} />
                    {phase !== "done" && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-[#E3264F]/70" />}
                  </span>
                </span>
              </div>
              <div className="rounded-[18px] bg-[#232323] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-white">{pass.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-white/55">
                      {pass.dateLabel}, {pass.timeLabel}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] text-white/55">Total</p>
                    <p className="text-[17px] font-semibold tabular-nums text-white">{pass.amountLabel}</p>
                  </div>
                </div>
                <div className="mt-4 flex h-6 items-center gap-2 text-[13.5px]" role="status" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.span
                      key={phase}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      {phase === "done" ? (
                        <m.span
                          className="grid size-5 place-items-center rounded-full bg-[#3DDC97] text-[#0B2A1C]"
                          initial={reduce ? false : { scale: 0.4 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        >
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                        </m.span>
                      ) : (
                        <Dots />
                      )}
                      <span className={phase === "done" ? "font-semibold text-white" : "text-white/75"}>{STATUS[phase]}</span>
                    </m.span>
                  </AnimatePresence>
                </div>
              </div>
              {/* The slot the paper feeds out of */}
              <div aria-hidden className="mx-3 mb-1 mt-2 h-2 rounded-full bg-black shadow-[inset_0_2px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.06)]" />
            </div>
          </m.div>

          {/* Paper: clipped at the slot so it comes out of the printer */}
          <div className="paper-keep relative -mt-3 overflow-hidden px-4 pb-6 pt-3">{phase !== "confirm" && <Paper pass={pass} reduce={!!reduce} />}</div>

          <AnimatePresence>
            {phase === "done" && (
              <m.div
                className="mt-auto grid gap-2 pt-2"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE, delay: reduce ? 0 : 0.15 }}
              >
                <Link
                  href="/passes"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-lavender text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover"
                >
                  Open my passes
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-12 items-center justify-center rounded-xl text-[15px] font-semibold text-ink-2 transition-colors duration-fast hover:bg-sunken hover:text-ink"
                >
                  Back to the event
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {phase === "done" && !reduce && <Confetti />}
      </m.div>
    </ModalDialog>
  );
}

/** Three dots that take turns, instead of a generic spinner. */
function Dots() {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="size-1.5 rounded-full bg-white/80"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */

const PRINT_MS = 2100;
// Thermal printers feed in short bursts: move, pause, move, pause.
const FEED = ["-100%", "-82%", "-82%", "-63%", "-63%", "-45%", "-45%", "-27%", "-27%", "-9%", "-9%", "0%"];
const FEED_TIMES = [0, 0.13, 0.19, 0.32, 0.38, 0.51, 0.57, 0.7, 0.76, 0.89, 0.93, 1];

function Paper({ pass, reduce }: { pass: PrintedPass; reduce: boolean }) {
  return (
    <m.div
      initial={reduce ? false : { y: "-100%" }}
      animate={reduce ? undefined : { y: FEED, rotate: [0, 0, 0.4, 0.4, -0.3, -0.3, 0.2, 0.2, -0.15, -0.15, 0, 0] }}
      transition={{ duration: PRINT_MS / 1000, times: FEED_TIMES, ease: "linear" }}
      className="relative origin-top"
    >
      <div className="relative bg-[#FFFDF6] text-[#1A1A1A] shadow-[0_0_0_1px_#E7E2D4,0_18px_30px_-14px_rgba(60,40,10,0.35)]">
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <BrandLogo className="text-[14px]" />
          <span className="font-mono text-[11px] tracking-[0.08em] text-[#8A8577]">Admit one</span>
        </div>
        {/* Event colours */}
        <div className="relative mx-5 h-14 overflow-hidden rounded-xl">
          <EventArt accent={pass.accent} seed={pass.seed} flat scrim={false} />
          <BrandMark className="absolute bottom-2 right-2 size-6 opacity-90 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.25))]" />
        </div>
        <div className="px-5 pb-4 pt-4">
          <p className="font-display text-[24px] leading-[1.05] tracking-[-0.02em]">{pass.title}</p>
          <p className="mt-1.5 text-[13px] text-[#55524A]">
            {pass.dateLabel}, {pass.timeLabel}
          </p>
          <p className="text-[13px] text-[#55524A]">{pass.venue}</p>

          <dl className="mt-4 space-y-1.5 border-y border-dashed border-[#CFC9B8] py-3 font-mono text-[12.5px]">
            <Row k="Holder" v={pass.holder} />
            <Row k="Pass" v={pass.passCode} />
          </dl>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-[12.5px] text-[#55524A]">Total</span>
            <span className="font-display text-[26px] leading-none tabular-nums">{pass.amountLabel}</span>
          </div>
          {pass.payNote && <p className="mt-1 text-right font-mono text-[11.5px] text-[#9A5B00]">{pass.payNote}</p>}

          {pass.qrSvg && (
            <div className="mt-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgSrc(pass.qrSvg)} alt={`Entry QR code for pass ${pass.passCode}`} className="size-[132px]" />
              <p className="mt-2 font-mono text-[11.5px] tracking-[0.14em] text-[#55524A]">{pass.passCode}</p>
            </div>
          )}
          <p className="mt-3 text-center text-[11.5px] text-[#8A8577]">Show this at the gate. It works offline.</p>
        </div>
        {/* Torn edge */}
        <svg aria-hidden viewBox="0 0 120 6" preserveAspectRatio="none" className="absolute left-0 top-full block h-[7px] w-full">
          <path d={TEETH} fill="#FFFDF6" />
        </svg>
      </div>
    </m.div>
  );
}

const TEETH = (() => {
  let d = "M0 0";
  for (let x = 0; x < 120; x += 6) d += ` L${x + 3} 6 L${x + 6} 0`;
  return `${d} Z`;
})();

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#8A8577]">{k}</dt>
      <dd className="truncate text-right">{v}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */

// Brand colours: red, lavender, ink, cream, plus a warm gold.
const CONFETTI_COLORS = ["#E3264F", "#F0D7FF", "#1A1A1A", "#FFD166", "#E3264F", "#C9A2FF", "#FFFFEB"];

/** One burst from the paper. Deterministic, so server and client agree. */
function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          x: (r(1) - 0.5) * 520,
          y: -(140 + r(2) * 260),
          fall: 380 + r(3) * 320,
          rot: (r(4) - 0.5) * 720,
          w: 6 + r(5) * 6,
          h: r(6) > 0.5 ? 10 + r(7) * 6 : 6 + r(7) * 4,
          round: r(8) > 0.7,
          ticket: r(10) > 0.86,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: r(9) * 0.12,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[38%] flex justify-center">
      {bits.map((b, i) => (
        <m.span
          key={i}
          className="absolute"
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: [0, b.x * 0.8, b.x], y: [0, b.y, b.y + b.fall], rotate: b.rot, opacity: [1, 1, 0] }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], times: [0, 0.35, 1], delay: b.delay }}
        >
          {b.ticket ? (
            <BrandMark className="size-4" />
          ) : (
            <span className="block" style={{ width: b.w, height: b.h, background: b.color, borderRadius: b.round ? 999 : 2 }} />
          )}
        </m.span>
      ))}
    </div>
  );
}
