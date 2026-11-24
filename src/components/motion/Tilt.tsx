"use client";

import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Cards that lean toward the cursor in 3D and catch a moving glare.
 * Purpose: gives the poster grid physical weight (these are tickets you could pick up) without
 * moving anything by itself. Mouse only; flat on touch and under reduced motion.
 */
export function Tilt({ children, className, max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.5 };
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(260px circle at ${gx} ${gy}, rgba(255,255,255,0.22), transparent 60%)`;
  const glow = useSpring(0, { stiffness: 200, damping: 26 });

  const move = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    glow.set(1);
  };
  const leave = () => {
    px.set(0.5);
    py.set(0.5);
    glow.set(0);
  };

  return (
    <div style={{ perspective: 900 }} className="h-full">
      <m.div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={cn("relative h-full will-change-transform", className)}
      >
        {children}
        <m.span aria-hidden style={{ background: glare, opacity: glow }} className="pointer-events-none absolute inset-0 z-[3] rounded-[inherit] mix-blend-soft-light" />
      </m.div>
    </div>
  );
}
