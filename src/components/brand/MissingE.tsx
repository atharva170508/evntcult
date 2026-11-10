"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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

const RING = "M15.5 6.5H26.5A12 12 0 0 1 38.5 18.5V29.5A12 12 0 0 1 26.5 41.5H15.5A12 12 0 0 1 3.5 29.5V18.5A12 12 0 0 1 15.5 6.5Z";

/** The image mark: a squared c with the e's bar falling out of it (evnt + cult). */
function MarkPaths({ color }: { color: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">
          <rect x="-10" y="-10" width="68" height="68" fill="#fff" />
          <rect x="24" y="15" width="30" height="18" fill="#000" transform="rotate(10 21 24)" />
        </mask>
      </defs>
      <path d={RING} fill="none" stroke={color} strokeWidth="7" mask={`url(#${id})`} />
      <path d="M10 24H47" fill="none" stroke={color} strokeWidth="6" transform="rotate(10 21 24)" />
    </>
  );
}

/** The mark on its own, in the text colour. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="EvntCult" fill="none">
      <MarkPaths color="currentColor" />
    </svg>
  );
}

/** Square icon for tight spots and the tab: the mark on lime. */
export function LogoIcon({ className = "size-9" }: { className?: string; blink?: boolean }) {
  return (
    <svg viewBox="-8 -8 64 64" className={className} role="img" aria-label="EvntCult">
      <rect x="-8" y="-8" width="64" height="64" rx="14" fill={LOGO_ACCENT} />
      <MarkPaths color="#08080c" />
    </svg>
  );
}
