"use client";

import { m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/**
 * Persistent semi-opaque atmospheric twilight backdrop fixed behind all public landing chapters.
 * Gives every frosted obsidian glass panel below the Hero subtle architectural depth
 * with slow scroll-linked parallax drift (zero pointer interference).
 */
export function TwilightBackdrop() {
  const reduced = !!useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24 });
  const p = reduced ? scrollYProgress : smooth;

  const y = useTransform(p, [0, 1], ["0%", "-10%"]);
  const scale = useTransform(p, [0, 1], [1.05, 1.16]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#121110]"
    >
      <m.img
        src="/images/cinematic/scene2-plate.jpg"
        alt=""
        style={reduced ? undefined : { y, scale }}
        className="h-[115%] w-full object-cover object-center opacity-[0.2] saturate-[1.08] will-change-transform"
      />
      {/* Atmospheric vignette + crimson/lavender volumetric depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(920px circle at 82% 24%, rgba(227,38,79,0.14), transparent 58%), radial-gradient(820px circle at 16% 78%, rgba(240,215,255,0.11), transparent 58%), linear-gradient(to bottom, rgba(18,17,16,0.58) 0%, rgba(18,17,16,0.72) 50%, rgba(18,17,16,0.84) 100%)",
        }}
      />
    </div>
  );
}
