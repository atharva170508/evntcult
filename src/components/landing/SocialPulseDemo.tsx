"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { EASE } from "@/components/motion/MotionProvider";

const INITIAL_REACTIONS = [
  { id: "fire", label: "Hyped", count: 14 },
  { id: "hands", label: "Count me in", count: 9 },
  { id: "music", label: "Setlist ready", count: 6 },
  { id: "bolt", label: "Bringing crew", count: 11 },
];

const BLAST_PRESETS = [
  "Gates open in 15 mins at Riverside Lawn. Show your QR at Desk 1.",
  "Soundcheck just wrapped. First 40 people get front-row lawn mats.",
  "Light rain cleared up, doors staying right on schedule at 7:30 pm.",
];

/**
 * Partiful-inspired interactive Guest Wall & Host Text Blasts preview.
 * Visitors can tap live reactions and send a sample host blast to see how attendees receive it.
 */
export function SocialPulseDemo() {
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(INITIAL_REACTIONS.map((r) => [r.id, r.count])),
  );
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [blastIdx, setBlastIdx] = useState(0);
  const [sentAt, setSentAt] = useState<string | null>(null);

  const toggleReact = (id: string) => {
    const next = !mine[id];
    setMine((p) => ({ ...p, [id]: next }));
    setCounts((p) => ({ ...p, [id]: p[id] + (next ? 1 : -1) }));
  };

  const sendBlast = () => {
    setBlastIdx((i) => (i + 1) % BLAST_PRESETS.length);
    setSentAt(
      new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date()),
    );
  };

  return (
    <Reveal as="section" aria-labelledby="social-h" className="py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
        {/* Left editorial copy */}
        <div>
          <h2
            id="social-h"
            className="font-display text-[clamp(40px,4.8vw,62px)] leading-[0.94] tracking-[-0.02em] text-ink"
          >
            Built for the crowd <em>before doors open.</em>
          </h2>
          <p className="mt-5 max-w-[42ch] text-[16px] leading-relaxed text-ink-2">
            Every event page carries a live guest wall where attendees drop notes and reactions
            before doors open, plus one-tap host blasts so schedule changes reach everyone
            instantly.
          </p>
        </div>

        {/* Right interactive sunken paper stage */}
        <div
          data-sample="true"
          className="rounded-[24px] bg-sunken/75 p-6 md:p-8"
        >
          <p className="mb-4 text-[12px] font-medium text-ink-subtle">Example guest wall &amp; host blast</p>

          <div className="space-y-4">
            {/* Live host blast card */}
            <div className="rounded-2xl bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <Bell className="size-3.5 text-accent-ink" aria-hidden />
                  Host update
                </span>
                <span className="font-mono text-[11.5px] text-ink-muted tabular-nums">
                  {sentAt ? `Sent ${sentAt}` : "Just now"}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <m.p
                  key={blastIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="mt-2.5 text-[15px] leading-relaxed text-ink"
                >
                  &ldquo;{BLAST_PRESETS[blastIdx]}&rdquo;
                </m.p>
              </AnimatePresence>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
                <div className="flex -space-x-2" aria-hidden>
                  {["RK", "KS", "AM", "PS"].map((init, i) => (
                    <span
                      key={init}
                      className="grid size-7 place-items-center rounded-full bg-ink text-[10.5px] font-semibold text-white ring-2 ring-surface"
                      style={{ zIndex: 4 - i }}
                    >
                      {init}
                    </span>
                  ))}
                  <span className="grid size-7 place-items-center rounded-full bg-sunken text-[10.5px] font-semibold text-ink-2 ring-2 ring-surface">
                    +42
                  </span>
                </div>
                <button
                  type="button"
                  onClick={sendBlast}
                  className="ui-press inline-flex h-9 items-center gap-1.5 rounded-xl bg-sunken px-3.5 text-[13px] font-semibold text-ink hover:bg-mist"
                >
                  <Send className="size-3.5" aria-hidden />
                  Next update
                </button>
              </div>
            </div>

            {/* Interactive reaction bar */}
            <div className="rounded-2xl bg-surface p-5 shadow-card">
              <div className="flex items-baseline justify-between">
                <p className="text-[14px] font-semibold text-ink">Sunset Sessions · Guest wall</p>
                <span className="text-[12px] text-ink-muted">Tap to react</span>
              </div>
              <p className="mt-1.5 text-[14px] text-ink-2">
                &ldquo;Anyone heading from Hostel 4 around 7? Sharing an auto.&rdquo;
              </p>

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Example reactions">
                {INITIAL_REACTIONS.map((r) => {
                  const active = Boolean(mine[r.id]);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleReact(r.id)}
                      aria-pressed={active}
                      className={cn(
                        "ui-press inline-flex min-h-[44px] items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors sm:min-h-[36px]",
                        active
                          ? "bg-lavender text-ink ring-2 ring-inset ring-ink"
                          : "bg-sunken text-ink-2 hover:bg-mist hover:text-ink",
                      )}
                    >
                      <span>{r.label}</span>
                      <span className="font-mono text-[12px] tabular-nums opacity-75">{counts[r.id]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
