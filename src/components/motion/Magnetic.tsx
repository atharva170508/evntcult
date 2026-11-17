"use client";

import { m, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef } from "react";

/**
 * Leans its child toward the pointer (at most `strength` px) and springs back on leave.
 * Pointer devices only; still on touch and under reduced motion.
 */
export function Magnetic({ children, strength = 10, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const move = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(Math.max(-1, Math.min(1, dx)) * strength);
    y.set(Math.max(-1, Math.min(1, dy)) * strength * 0.6);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.span ref={ref} onPointerMove={move} onPointerLeave={leave} style={{ x: sx, y: sy }} className={className ?? "inline-block"}>
      {children}
    </m.span>
  );
}
