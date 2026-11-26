"use client";

import { useRef, useState } from "react";
import { Check, QrCode, ScanLine, Ticket } from "lucide-react";
import { AnimatePresence, m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { TransitionPanel } from "@/components/motion/TransitionPanel";
import { EASE } from "@/components/motion/MotionProvider";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { TextScramble } from "@/components/shadcn/text-scramble";
import { TextLoop } from "@/components/shadcn/text-loop";
import { InView } from "@/components/shadcn/in-view";
import { COUT } from "@/lib/motion-curves";

const SAMPLE_EVENTS = [
  { id: "1", kind: "Hackathon", title: "HackNight '26", meta: "Fri, 6:00 pm · Main Auditorium", fee: "Free" },
  { id: "2", kind: "Music", title: "Sunset Sessions", meta: "Sat, 7:30 pm · Riverside Lawn", fee: "₹199" },
  { id: "3", kind: "Sports", title: "Box Cricket Finals", meta: "Sun, 5:00 pm · North Turf", fee: "₹150" },
  { id: "4", kind: "Workshop", title: "Design Systems Lab", meta: "Tue, 4:00 pm · Studio 2", fee: "Free" },
];

const STEPS = [
  {
    num: "01",
    title: "Find an event",
    desc: "Filter by kind, day, or venue in one tap. Every campus event lives on one clean board.",
  },
  {
    num: "02",
    title: "Claim your pass",
    desc: "One tap to register. Your personal QR pass is issued immediately and works offline.",
  },
  {
    num: "03",
    title: "Walk in with a scan",
    desc: "Show your phone at the gate. Volunteers scan in under a second, even without signal.",
  },
];

/**
 * Interactive 3-stage Dark Obsidian showcase for "One pass for every gate."
 * Features spring step morphing, BorderTrail pass frame, TextScramble serials,
 * and a live crimson-emerald laser scanline beam on gate check-in.
 */
export function OnePassInteractive() {
  const reduced = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<string>("All");
  const [claimed, setClaimed] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "admitted">("idle");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const cardParallaxY = useSpring(useTransform(scrollYProgress, [0, 1], [36, -28]), {
    stiffness: 90,
    damping: 22,
  });

  const filtered = filter === "All" ? SAMPLE_EVENTS : SAMPLE_EVENTS.filter((e) => e.kind === filter);

  const runScan = () => {
    if (scanState === "scanning") return;
    if (scanState === "admitted") {
      setScanState("idle");
      return;
    }
    setScanState("scanning");
    window.setTimeout(() => setScanState("admitted"), 1050);
  };

  return (
    <section
      ref={sectionRef}
      id="onepass"
      aria-labelledby="onepass-h"
      className="relative z-10 w-full scroll-mt-24 border-t border-white/10 bg-[#121110]/60 py-20 text-[#EDE3DA] backdrop-blur-[2px] md:py-28"
    >
      <div className="mx-auto max-w-[1360px] px-gutter">
        <InView
          once
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.7, ease: COUT }}
          className="grid gap-12 lg:grid-cols-[0.92fr_1.18fr] lg:items-center lg:gap-16"
        >
          {/* Left: editorial serif headline + step index */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F0D7FF]/80">
              01 · OnePass Engine
            </p>
            <h2
              id="onepass-h"
              className="mt-3 font-display text-[clamp(42px,5.2vw,68px)] leading-[0.94] tracking-[-0.03em] text-[#EDE3DA]"
            >
              One pass for <em className="italic text-[#F0D7FF]">every gate.</em>
            </h2>

            <div role="tablist" aria-label="How EvntCult works" className="mt-8 space-y-1.5">
              {STEPS.map((s, idx) => {
                const active = step === idx;
                return (
                  <button
                    key={s.num}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStep(idx)}
                    className={cn(
                      "group relative flex w-full items-start gap-5 rounded-2xl px-4 py-4 text-left transition-colors duration-fast",
                      active ? "text-[#EDE3DA]" : "text-[#EDE3DA]/55 hover:text-[#EDE3DA]/90",
                    )}
                  >
                    {active && (
                      <m.span
                        layoutId="onepass-active-row"
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-2xl border border-white/15 bg-white/[0.06]"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span
                      className={cn(
                        "font-display text-[26px] leading-none tabular-nums transition-colors",
                        active ? "text-[#F0D7FF]" : "text-[#EDE3DA]/35 group-hover:text-[#EDE3DA]/70",
                      )}
                    >
                      {s.num}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17.5px] font-semibold tracking-[-0.01em] text-[#EDE3DA]">
                        {s.title}
                      </span>
                      <span
                        className={cn(
                          "mt-1 block max-w-[38ch] text-[14.5px] leading-relaxed transition-colors",
                          active ? "text-[#EDE3DA]/75" : "text-[#EDE3DA]/50",
                        )}
                      >
                        {s.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Frosted Obsidian architectural preview well with scroll parallax & BorderTrail */}
          <m.div
            data-sample="true"
            style={reduced ? undefined : { y: cardParallaxY }}
            className="relative overflow-hidden rounded-[24px] border border-white/15 bg-[#1A1816]/78 p-6 shadow-[0_32px_70px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-8"
          >
            <BorderTrail
              size={84}
              className="bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent opacity-60"
              transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
            />
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#EDE3DA]/55">
                <TextLoop interval={2.6}>
                  <span>Interactive preview</span>
                  <span>0.4s offline scan</span>
                  <span>Auto .ics sync</span>
                  <span>Zero platform cut</span>
                </TextLoop>
              </div>
              <span className="font-mono text-[11px] text-[#F0D7FF]/80">
                STEP 0{step + 1} / 03
              </span>
            </div>

            <TransitionPanel activeIndex={step} className="min-h-[280px]">
              {/* Stage 1: Clean hairline-divided live event list */}
              <div>
                <div
                  className="inline-flex flex-wrap gap-0.5 rounded-xl border border-white/10 bg-[#121110] p-1"
                  role="group"
                  aria-label="Filter example events"
                >
                  {["All", "Hackathon", "Music", "Sports", "Workshop"].map((k) => {
                    const on = filter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setFilter(k)}
                        className={cn(
                          "relative rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                          on ? "text-[#121110]" : "text-[#EDE3DA]/60 hover:text-[#EDE3DA]",
                        )}
                      >
                        {on && (
                          <m.span
                            layoutId="onepass-filter-pill"
                            aria-hidden
                            className="absolute inset-0 rounded-lg bg-[#F0D7FF]"
                            transition={{ type: "spring", stiffness: 460, damping: 36 }}
                          />
                        )}
                        <span className="relative z-10">{k}</span>
                      </button>
                    );
                  })}
                </div>

                <ul className="mt-5 divide-y divide-white/10 border-t border-white/10">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((ev) => (
                      <m.li
                        layout
                        key={ev.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        className="flex items-center justify-between gap-4 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-[#EDE3DA]">{ev.title}</p>
                          <p className="truncate text-[13.5px] text-[#EDE3DA]/55">{ev.meta}</p>
                        </div>
                        <span className="shrink-0 font-mono text-[13px] font-medium tabular-nums text-[#F0D7FF]">
                          {ev.fee}
                        </span>
                      </m.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>

              {/* Stage 2: Crisp Wallet-style pass issuance with TextScramble */}
              <div className="flex flex-col justify-between gap-6">
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#121110] p-5">
                  {claimed && (
                    <BorderTrail
                      size={68}
                      className="bg-gradient-to-l from-[#5EE0A8] via-[#F0D7FF] to-transparent"
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    />
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-[32px] leading-none text-[#EDE3DA]">
                        Sunset Sessions
                      </p>
                      <p className="mt-2 text-[13.5px] text-[#EDE3DA]/65">
                        Sat 12 Dec, 7:30 pm · Riverside Lawn
                      </p>
                    </div>
                    <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#FFFEF6] ring-1 ring-white/20">
                      <QrCode className="size-8 text-[#121110]" strokeWidth={1.6} aria-hidden />
                    </div>
                  </div>

                  <div className="my-4 border-t border-dashed border-white/20" aria-hidden />

                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-mono font-semibold tracking-[0.06em] text-[#F0D7FF]">
                      {claimed ? (
                        <TextScramble trigger={claimed}>SOLAR-FALCON-0042</TextScramble>
                      ) : (
                        "PASS READY"
                      )}
                    </span>
                    <AnimatePresence mode="wait">
                      {claimed ? (
                        <m.span
                          key="issued"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#5EE0A8]/15 px-2.5 py-0.5 font-semibold text-[#5EE0A8]"
                        >
                          <Check className="size-3.5" strokeWidth={2.8} aria-hidden />
                          Pass issued
                        </m.span>
                      ) : (
                        <m.span
                          key="open"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="font-medium text-[#EDE3DA]/60"
                        >
                          Admit one · Free
                        </m.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-[13.5px] text-[#EDE3DA]/60">
                    {claimed ? "Saved to My Passes for offline entry." : "Tap to see instant pass issue."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setClaimed((c) => !c)}
                    className="ui-press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#F0D7FF] px-5 text-[14.5px] font-semibold text-[#121110] transition-colors hover:bg-white"
                  >
                    <Ticket className="size-4" strokeWidth={2.1} aria-hidden />
                    {claimed ? "Reset" : "Claim pass"}
                  </button>
                </div>
              </div>

              {/* Stage 3: Live laser gate scan simulation */}
              <div className="flex flex-col justify-between gap-6">
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#121110] p-5">
                  <div className="flex items-center gap-5">
                    <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#FFFEF6] ring-1 ring-white/20">
                      <QrCode className="size-14 text-[#121110]" strokeWidth={1.5} aria-hidden />
                      {/* Glowing Laser Gate Scan Beam */}
                      <AnimatePresence>
                        {scanState === "scanning" && (
                          <m.div
                            key="laser-beam"
                            aria-hidden
                            initial={{ top: "4%", opacity: 0 }}
                            animate={{ top: ["4%", "88%", "4%"], opacity: [0.95, 1, 0.95] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.95, ease: "easeInOut", repeat: Infinity }}
                            className="pointer-events-none absolute inset-x-0 h-[3px] bg-[#E3264F] shadow-[0_0_16px_4px_rgba(227,38,79,0.85)]"
                          >
                            <span className="absolute inset-x-0 -top-4 h-8 bg-gradient-to-b from-[#E3264F]/0 via-[#E3264F]/35 to-[#E3264F]/0" />
                          </m.div>
                        )}
                      </AnimatePresence>
                      {scanState === "admitted" && (
                        <m.div
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 grid place-items-center bg-[#121110]/75 backdrop-blur-[1px]"
                        >
                          <span className="grid size-10 place-items-center rounded-full bg-[#5EE0A8] text-[#121110]">
                            <Check className="size-5" strokeWidth={3} aria-hidden />
                          </span>
                        </m.div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-[#EDE3DA]/50">
                        Gate 1 · Main Lawn
                      </p>
                      <p className="mt-1 font-display text-[30px] leading-none text-[#EDE3DA]">
                        Calm Badger
                      </p>
                      <div className="mt-3">
                        {scanState === "admitted" ? (
                          <m.span
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#5EE0A8]/15 px-3 py-1 text-[13px] font-semibold text-[#5EE0A8]"
                          >
                            <Check className="size-3.5" strokeWidth={2.8} aria-hidden />
                            Admitted · 0.4s offline
                          </m.span>
                        ) : scanState === "scanning" ? (
                          <span className="inline-flex items-center gap-2 font-mono text-[12.5px] font-medium text-[#E3264F]">
                            <span className="size-2 animate-ping rounded-full bg-[#E3264F]" aria-hidden />
                            Verifying signature…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#EDE3DA]/60">
                            Ready at the gate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-[13.5px] text-[#EDE3DA]/60">
                    {scanState === "admitted" ? "Checked in locally; syncs when online." : "Works even when campus Wi-Fi drops."}
                  </p>
                  <button
                    type="button"
                    onClick={runScan}
                    disabled={scanState === "scanning"}
                    className="ui-press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#F0D7FF] px-5 text-[14.5px] font-semibold text-[#121110] transition-colors hover:bg-white disabled:opacity-60"
                  >
                    <ScanLine className="size-4" strokeWidth={2.1} aria-hidden />
                    {scanState === "admitted" ? "Scan again" : scanState === "scanning" ? "Scanning…" : "Simulate scan"}
                  </button>
                </div>
              </div>
            </TransitionPanel>
          </m.div>
        </InView>
      </div>
    </section>
  );
}
