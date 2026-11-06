"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * EvntCult logo — "the missing e".
 *
 * The name drops the e from "event". A lime typing cursor sits in the gap between v and n,
 * as if the name is waiting for you to type the missing letter. In "type" mode it types
 * "e", deletes it, types "you" (you're the missing e), deletes it, and goes back to blinking.
 *
 *   motion="type"   full animation once when it comes into view, again on hover
 *   motion="blink"  just the blinking cursor (top bar, sidebar)
 *   motion="still"  static bar (print, certificates)
 * People who ask their device for reduced motion always get "still".
 *
 * Accent: rgb(220, 254, 98) / #dcfe62 (Tailwind `volt`).
 */
export const LOGO_ACCENT = "#dcfe62";

type Motion = "type" | "blink" | "still";
const SCRIPT = ["e", "you"];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

export function LogoWordmark({ className, motion = "blink" }: { className?: string; motion?: Motion }) {
  const reduce = usePrefersReducedMotion();
  const mode: Motion = reduce ? "still" : motion;
  const [typed, setTyped] = useState("");
  const [pressing, setPressing] = useState(false);
  const runId = useRef(0);
  const ref = useRef<HTMLSpanElement>(null);

  const play = useCallback(async () => {
    const id = ++runId.current;
    const alive = () => id === runId.current;
    setTyped("");
    setPressing(false);
    await wait(600);
    for (const word of SCRIPT) {
      for (const ch of word) {
        if (!alive()) return;
        setPressing(true);
        setTyped((t) => t + ch);
        await wait(80);
        setPressing(false);
        await wait(90 + Math.random() * 80);
      }
      await wait(word === "e" ? 1000 : 1500);
      for (let i = 0; i < word.length; i++) {
        if (!alive()) return;
        setTyped((t) => t.slice(0, -1));
        await wait(70);
      }
      await wait(320);
    }
  }, []);

  // Play once when it first scrolls into view.
  useEffect(() => {
    if (mode !== "type" || !ref.current) return;
    const runs = runId;
    // Already on screen at load (top bar, sign-in): start now. Otherwise wait until it scrolls in (footer).
    const r = ref.current.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight && r.width > 0) {
      void play();
      return () => {
        runs.current++;
      };
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void play();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      runs.current++; // stop a running animation when unmounting
    };
  }, [mode, play]);

  // Plain inline text (not flex), so the cursor sits on the letters' baseline like a real text cursor.
  return (
    <span
      ref={ref}
      role="img"
      aria-label="EvntCult"
      onMouseEnter={mode === "type" ? () => void play() : undefined}
      className={cn("inline-block whitespace-nowrap font-logo font-extrabold leading-none tracking-[-0.045em]", className)}
    >
      <span aria-hidden>ev</span>
      <span aria-hidden className="inline-block min-w-[0.2em] text-center">
        {typed.split("").map((ch, i) => (
          <span key={`${i}-${ch}`} className="inline-block animate-type-in" style={{ color: LOGO_ACCENT }}>
            {ch}
          </span>
        ))}
        <span
          className={cn(
            "mx-[0.035em] inline-block h-[0.74em] w-[0.08em] origin-bottom rounded-[0.03em] align-[-0.02em] transition-transform duration-100 ease-out",
            mode !== "still" && !pressing && !typed && "animate-caret-blink",
            pressing && "scale-y-[0.82]",
          )}
          style={{ background: LOGO_ACCENT }}
        />
      </span>
      <span aria-hidden>ntcult</span>
    </span>
  );
}

/** Square icon for tight spots (collapsed sidebar, tab icon): the cursor on lime. */
export function LogoIcon({ className = "size-9", blink = true }: { className?: string; blink?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="EvntCult">
      <rect width="64" height="64" rx="15" fill={LOGO_ACCENT} />
      <rect x="28.5" y="15" width="7" height="34" rx="1.6" fill="#08080c" className={blink ? "motion-safe:animate-caret-blink" : undefined} />
    </svg>
  );
}
