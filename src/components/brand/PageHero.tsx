"use client";

import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { COUT } from "@/lib/motion-curves";

/**
 * Page header across all inner routes (/events, /passes, /calendar, /vault, /certificates, /venues):
 * Clip-masked COUT headline slide + staggered subtitle & action rail.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  marquee?: string[];
  className?: string;
}) {
  const reduced = !!useReducedMotion();
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-6 pt-8 md:pb-8 md:pt-12", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="sr-only">{eyebrow}</p>}
        <h1 className="overflow-hidden pb-0.5 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[32px]">
          <m.span
            initial={reduced ? false : { y: "105%", opacity: 0.4 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.52, ease: COUT }}
            className="block"
          >
            {title}
          </m.span>
        </h1>
        {sub && (
          <m.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.42, ease: COUT }}
            className="mt-1.5 text-[15px] text-ink-muted"
          >
            {sub}
          </m.div>
        )}
      </div>
      {actions && (
        <m.div
          initial={reduced ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.14, duration: 0.42, ease: COUT }}
          className="flex flex-wrap items-center gap-2"
        >
          {actions}
        </m.div>
      )}
    </header>
  );
}
