"use client";

import { useState } from "react";
import { Check, QrCode, ScanLine, Ticket } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";
import { TransitionPanel } from "@/components/motion/TransitionPanel";
import { EASE } from "@/components/motion/MotionProvider";

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
 * Interactive 3-stage editorial showcase for "One pass for every gate."
 * Warm cream-paper & ink craft, hairline rules, zero decorative chrome.
 */
export function OnePassInteractive() {
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<string>("All");
  const [claimed, setClaimed] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "admitted">("idle");

  const filtered = filter === "All" ? SAMPLE_EVENTS : SAMPLE_EVENTS.filter((e) => e.kind === filter);

  const runScan = () => {
    if (scanState === "scanning") return;
    if (scanState === "admitted") {
      setScanState("idle");
      return;
    }
    setScanState("scanning");
    window.setTimeout(() => setScanState("admitted"), 820);
  };

  return (
    <section
      id="onepass"
      aria-labelledby="onepass-h"
      className="bleed scroll-mt-28 border-y border-line bg-sunken/70 py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1360px] px-gutter">
      <div className="grid gap-12 lg:grid-cols-[0.92fr_1.18fr] lg:items-center lg:gap-16">
        {/* Left: editorial serif headline + step index */}
        <div>
          <h2
            id="onepass-h"
            className="font-display text-[clamp(42px,5.2vw,68px)] leading-[0.94] tracking-[-0.03em] text-ink"
          >
            One pass for <em>every gate.</em>
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
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {active && (
                    <m.span
                      layoutId="onepass-active-row"
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-2xl bg-surface shadow-card"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span
                    className={cn(
                      "font-display text-[26px] leading-none tabular-nums transition-colors",
                      active ? "text-ink" : "text-ink-subtle group-hover:text-ink-2",
                    )}
                  >
                    {s.num}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17.5px] font-semibold tracking-[-0.01em] text-ink">
                      {s.title}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block max-w-[38ch] text-[14.5px] leading-relaxed transition-colors",
                        active ? "text-ink-2" : "text-ink-muted",
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

        {/* Right: sunken paper well so the inner interactive surface is the single elevated card */}
        <div
          data-sample="true"
          className="relative overflow-hidden rounded-[24px] bg-sunken/75 p-6 md:p-8"
        >
          <p className="mb-5 text-[12px] font-medium text-ink-subtle">Example</p>

          <TransitionPanel activeIndex={step} className="min-h-[276px]">
            {/* Stage 1: Clean hairline-divided live event list */}
            <div>
              <div
                className="inline-flex flex-wrap gap-0.5 rounded-xl bg-sunken p-1"
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
                        on ? "text-ink" : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {on && (
                        <m.span
                          layoutId="onepass-filter-pill"
                          aria-hidden
                          className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_2px_rgba(60,40,10,0.1)]"
                          transition={{ type: "spring", stiffness: 460, damping: 36 }}
                        />
                      )}
                      <span className="relative z-10">{k}</span>
                    </button>
                  );
                })}
              </div>

              <ul className="mt-5 divide-y divide-line border-t border-line">
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
                        <p className="truncate text-[15px] font-semibold text-ink">{ev.title}</p>
                        <p className="truncate text-[13.5px] text-ink-muted">{ev.meta}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[13px] font-medium tabular-nums text-ink-2">
                        {ev.fee}
                      </span>
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            {/* Stage 2: Crisp Apple-Wallet-like pass issuance */}
            <div className="flex flex-col justify-between gap-6">
              <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-canvas p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-[32px] leading-none text-ink">
                      Sunset Sessions
                    </p>
                    <p className="mt-2 text-[13.5px] text-ink-2">
                      Sat 12 Dec, 7:30 pm · Riverside Lawn
                    </p>
                  </div>
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-line-strong">
                    <QrCode className="size-8 text-ink" strokeWidth={1.6} aria-hidden />
                  </div>
                </div>

                <div className="stub-tear my-4" aria-hidden />

                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-mono font-medium text-ink-muted">EC-041-CB</span>
                  <AnimatePresence mode="wait">
                    {claimed ? (
                      <m.span
                        key="issued"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-live-soft px-2.5 py-0.5 font-semibold text-live"
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
                        className="font-medium text-ink-muted"
                      >
                        Admit one · Free
                      </m.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[13.5px] text-ink-muted">
                  {claimed ? "Saved to My Passes for offline entry." : "Tap to see instant pass issue."}
                </p>
                <button
                  type="button"
                  onClick={() => setClaimed((c) => !c)}
                  className="ui-press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-lavender px-5 text-[14.5px] font-semibold text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover"
                >
                  <Ticket className="size-4" strokeWidth={2.1} aria-hidden />
                  {claimed ? "Reset" : "Claim pass"}
                </button>
              </div>
            </div>

            {/* Stage 3: Live gate scan simulation */}
            <div className="flex flex-col justify-between gap-6">
              <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-canvas p-5">
                <div className="flex items-center gap-5">
                  <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-line-strong">
                    <QrCode className="size-14 text-ink" strokeWidth={1.5} aria-hidden />
                    {scanState === "scanning" && (
                      <span
                        aria-hidden
                        className="scanline pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-live/0 via-live/45 to-live/0"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-ink-muted">Gate 1 · Main Lawn</p>
                    <p className="mt-0.5 font-display text-[30px] leading-none text-ink">
                      Calm Badger
                    </p>
                    <div className="mt-3">
                      {scanState === "admitted" ? (
                        <m.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-live-soft px-3 py-1 text-[13px] font-semibold text-live"
                        >
                          <Check className="size-3.5" strokeWidth={2.8} aria-hidden />
                          Admitted · 7:02 pm
                        </m.span>
                      ) : scanState === "scanning" ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
                          Verifying pass…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
                          Ready at the gate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[13.5px] text-ink-muted">
                  {scanState === "admitted" ? "Checked in locally; syncs when online." : "Works even when campus Wi-Fi drops."}
                </p>
                <button
                  type="button"
                  onClick={runScan}
                  disabled={scanState === "scanning"}
                  className="ui-press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-lavender px-5 text-[14.5px] font-semibold text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover disabled:opacity-60"
                >
                  <ScanLine className="size-4" strokeWidth={2.1} aria-hidden />
                  {scanState === "admitted" ? "Scan again" : scanState === "scanning" ? "Scanning…" : "Simulate scan"}
                </button>
              </div>
            </div>
          </TransitionPanel>
        </div>
      </div>
      </div>
    </section>
  );
}
