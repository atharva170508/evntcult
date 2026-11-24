"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Scroll-linked reading focus: the item is dim until it reaches the middle of the screen,
 * comes to full strength there, and eases back once passed.
 * Purpose: a numbered sequence (find, register, scan) should be read one step at a time.
 * Opacity and a 24px slide only; static and fully visible under prefers-reduced-motion.
 */
export function Focus({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "center 50%", "end 8%"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.22, 1, 0.42]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [-24, 0, 0]);
  return (
    <m.div ref={ref} style={reduce ? undefined : { opacity, x }} className={className}>
      {children}
    </m.div>
  );
}

/** Moves its child at a fraction of the scroll speed, for depth. Static under prefers-reduced-motion. */
export function Parallax({ children, className, range = 60 }: { children: React.ReactNode; className?: string; range?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
  return (
    <m.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </m.div>
  );
}
