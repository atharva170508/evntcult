"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { Magnetic } from "@/components/motion/Magnetic";
import { BorderTrail } from "@/components/shadcn/border-trail";

/**
 * Scroll-scrubbed Twilight Closing Finale:
 * As you scroll to the bottom, the giant "evntcult" background wordmark rises smoothly
 * from below while the twilight crimson-lavender glow blooms behind "See you at the gate."
 */
export function ClosingFinale() {
  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 24 });
  const p = reduced ? scrollYProgress : smooth;

  const wordY = useTransform(p, [0, 1], [110, 0]);
  const wordScale = useTransform(p, [0, 1], [0.92, 1]);
  const glowOp = useTransform(p, [0.1, 1], [0.25, 1]);
  const headY = useTransform(p, [0.1, 0.85], [32, 0]);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden border-t border-white/10 bg-[#121110]/65 py-24 text-[#EDE3DA] backdrop-blur-[3px] md:py-32"
    >
      <m.div
        aria-hidden
        style={reduced ? undefined : { opacity: glowOp }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(760px circle at 80% 100%, rgba(227,38,79,0.28), transparent 60%), radial-gradient(660px circle at 15% 0%, rgba(240,215,255,0.16), transparent 55%)",
          }}
        />
      </m.div>

      <m.div
        aria-hidden
        style={reduced ? undefined : { y: wordY, scale: wordScale }}
        className="pointer-events-none absolute inset-x-0 -bottom-6 select-none text-center font-display text-[clamp(96px,22vw,280px)] font-semibold leading-[0.8] tracking-[-0.045em] text-[#EDE3DA]/[0.07]"
      >
        evntcult
      </m.div>

      <div className="relative z-10 mx-auto max-w-[1360px] px-gutter">
        <m.div
          style={reduced ? undefined : { y: headY }}
          className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F0D7FF]/80">
              05 · Ready for campus
            </p>
            <h2 className="mt-3 max-w-[14ch] font-display text-[clamp(48px,6.5vw,92px)] leading-[0.92] tracking-[-0.03em] text-[#EDE3DA]">
              See you at <em className="italic text-[#F0D7FF]">the gate.</em>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Magnetic>
              <Link
                href="/signin?mode=signup"
                className="relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-[14px] bg-[#F0D7FF] px-6 text-[16px] font-semibold text-[#121110] transition-colors hover:bg-white"
              >
                <BorderTrail
                  size={54}
                  className="bg-gradient-to-l from-[#E3264F] via-[#121110] to-transparent"
                  transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                />
                <span className="relative z-10 inline-flex items-center gap-2">
                  Sign up free <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </Link>
            </Magnetic>
            <Link
              href="/events"
              className="text-[16px] font-semibold text-[#EDE3DA]/85 underline decoration-white/30 decoration-2 underline-offset-[6px] transition-colors duration-fast hover:text-white hover:decoration-[#F0D7FF]"
            >
              Browse events
            </Link>
          </div>
        </m.div>
      </div>
    </section>
  );
}
