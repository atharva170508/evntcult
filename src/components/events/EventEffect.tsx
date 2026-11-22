"use client";

import { useMemo } from "react";
import { EFFECTS, isEffect } from "@/lib/effects";

/**
 * Partiful-style: a handful of emoji drifting down behind the page, chosen by the organizer.
 * Pure CSS (no JS per frame), sparse, behind content, and gone under prefers-reduced-motion.
 */
export function EventEffect({ effect }: { effect: string | null }) {
  const glyphs = isEffect(effect) ? EFFECTS[effect].glyphs : [];
  const drops = useMemo(() => {
    // Deterministic spread so server and client markup match.
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 14 }, (_, i) => ({
      g: glyphs[i % Math.max(1, glyphs.length)],
      x: Math.round(rnd() * 100),
      size: 14 + Math.round(rnd() * 14),
      dur: 11 + rnd() * 9,
      delay: -rnd() * 20,
      sway: 12 + Math.round(rnd() * 26),
      spin: Math.round(rnd() * 80 - 40),
    }));
  }, [glyphs]);
  if (!glyphs.length) return null;
  return (
    <div aria-hidden className="fx-layer pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      {drops.map((d, i) => (
        <span
          key={i}
          className="fx-drop"
          style={{
            left: `${d.x}%`,
            fontSize: d.size,
            animationDuration: `${d.dur}s, ${d.dur / 3}s`,
            animationDelay: `${d.delay}s, ${d.delay}s`,
            ["--sway" as string]: `${d.sway}px`,
            ["--spin" as string]: `${d.spin}deg`,
          }}
        >
          {d.g}
        </span>
      ))}
    </div>
  );
}
