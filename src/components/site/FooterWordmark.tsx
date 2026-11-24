"use client";

import { useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { toast } from "@/components/ui/Toaster";

const LETTERS = ["e", "v", "n", "t", "c", "u", "l", "t"];
// C major pentatonic frequencies (soft marimba-like scale)
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

const FOOTNOTES = [
  <>
    Made by <span className="font-semibold text-ink">Synchronous Labs</span>
  </>,
  <>
    Fueled by <span className="font-semibold text-ink">2 AM cutting chai</span>
  </>,
  <>
    0% attendance, <span className="font-semibold text-ink">100% fest turnout</span>
  </>,
  <>
    No PDFs were harmed <span className="font-semibold text-ink">making this pass</span>
  </>,
];

function playNote(freq: number, ctxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  } catch {
    // Ignore audio block
  }
}

export function FooterWordmark() {
  const reduce = useReducedMotion();
  const audioCtx = useRef<AudioContext | null>(null);
  const [played, setPlayed] = useState<Set<number>>(() => new Set());
  const [awarded, setAwarded] = useState(false);

  const hit = (i: number) => {
    playNote(NOTES[i], audioCtx);
    setPlayed((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      if (next.size === LETTERS.length && !awarded) {
        setAwarded(true);
        toast("You played the whole wordmark. Club band auditions are Friday.", {
          tone: "info",
          ms: 4200,
        });
      }
      return next;
    });
  };

  return (
    <div
      aria-hidden
      className="mt-8 flex select-none items-baseline justify-center font-sans text-[clamp(64px,16.5vw,230px)] font-[800] leading-[0.84] tracking-[-0.06em]"
    >
      {LETTERS.map((ch, i) => {
        const lit = played.has(i);
        return (
          <m.button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => hit(i)}
            whileHover={
              reduce
                ? undefined
                : { y: -12, rotate: i % 2 === 0 ? -4 : 4, scale: 1.04 }
            }
            whileTap={reduce ? undefined : { y: 4, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 460, damping: 20 }}
            className={
              lit
                ? "cursor-pointer bg-transparent p-0 text-ink/20 transition-colors hover:text-[#E3264F]/55 dark:text-ink/25"
                : "cursor-pointer bg-transparent p-0 text-ink/[0.06] transition-colors hover:text-ink/25 dark:text-ink/[0.08] dark:hover:text-ink/30"
            }
            title="Click to play a note"
          >
            {ch}
          </m.button>
        );
      })}
    </div>
  );
}

export function FooterFootnote() {
  const [idx, setIdx] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setIdx((n) => (n + 1) % FOOTNOTES.length)}
      className="cursor-pointer text-left text-ink-muted transition-colors hover:text-ink"
      title="Click for a campus fact"
    >
      {FOOTNOTES[idx]}
    </button>
  );
}
