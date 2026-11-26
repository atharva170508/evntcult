"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { COUT, QOUT } from "@/lib/motion-curves";
import { BorderTrail } from "@/components/shadcn/border-trail";

/**
 * Clip-masked cinema headline entrance for every inner page masthead.
 * Mirrors the public CinemaHero reveal with zero layout shift.
 */
export function CinemaHeadline({
  children,
  className,
  delay = 0.04,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = !!useReducedMotion();
  return (
    <div className={cn("overflow-hidden pb-1", className)}>
      <m.div
        initial={reduced ? false : { y: "102%", opacity: 0.25 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ delay, duration: 0.62, ease: COUT }}
      >
        {children}
      </m.div>
    </div>
  );
}

/**
 * Scroll-triggered cinema reveal block for inner page sections, cards, and lists.
 * Uses GPU-only transform + opacity with crisp QOUT deceleration.
 */
export function CinemaReveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = !!useReducedMotion();
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ delay, duration: 0.56, ease: QOUT }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * Frosted Obsidian Twilight spotlight frame with subtle animated BorderTrail perimeter glow.
 * Great for featured event spotlights, empty wallet showcases, and certificate previews.
 */
export function CinemaSpotlightFrame({
  children,
  className,
  trail = true,
}: {
  children: ReactNode;
  className?: string;
  trail?: boolean;
}) {
  const reduced = !!useReducedMotion();
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: QOUT }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-line-strong bg-sunken/75 backdrop-blur-xl dark:border-white/12 dark:bg-[#161412]/78 dark:shadow-[0_32px_70px_-34px_rgba(0,0,0,0.85)]",
        className,
      )}
    >
      {trail && !reduced && (
        <BorderTrail
          size={88}
          className="pointer-events-none z-20 bg-gradient-to-l from-[#E3264F] via-[#F0D7FF] to-transparent opacity-60"
          transition={{ repeat: Infinity, duration: 7.5, ease: "linear" }}
        />
      )}
      {children}
    </m.div>
  );
}
