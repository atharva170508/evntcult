"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { EventArt } from "@/components/ui/EventArt";
import { EASE } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

const KINDS = [
  { key: "PARTY", label: "Nights out", accent: "violet", names: ["Sunset Sessions", "Rooftop Social", "Neon Night"] },
  { key: "TECH", label: "Tech", accent: "blue", names: ["Hack Night", "Build with AI", "Demo Day"] },
  { key: "SPORTS", label: "Sports", accent: "orange", names: ["Midnight Run", "Box Cricket League", "5-a-side Friday"] },
  { key: "CULTURAL", label: "Culture", accent: "pink", names: ["Garba Night", "Open Mic Poetry", "Diwali Mela"] },
  { key: "WORKSHOP", label: "Workshops", accent: "teal", names: ["Pottery Sunday", "Figma in 90 Minutes", "Film Photo Walk"] },
  { key: "GAMING", label: "Gaming", accent: "red", names: ["Valorant Cup", "Retro Arcade Night", "Chess Blitz"] },
] as const;

/** Types a string out, then holds it. Instant when motion is reduced. */
function useTyped(text: string, off: boolean) {
  const [n, setN] = useState(off ? text.length : 0);
  useEffect(() => {
    if (off) return setN(text.length);
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [text, off]);
  return text.slice(0, n);
}

/**
 * Home for someone with nothing booked yet: their first pass, already printed with their name,
 * waiting for an event. It flips through kinds of night out (the poster redraws, the name types
 * itself) until they tap one, and the stub sends them to exactly that kind of event.
 */
export function EmptyTicket({ name, dateLine }: { name: string; dateLine: string }) {
  const reduce = !!useReducedMotion();
  const [i, setI] = useState(0);
  const [locked, setLocked] = useState(false);
  const [round, setRound] = useState(0);
  const kind = KINDS[i];
  const title = kind.names[round % kind.names.length];
  const typed = useTyped(title, reduce);

  useEffect(() => {
    if (locked || reduce) return;
    const id = setTimeout(() => {
      setI((x) => (x + 1) % KINDS.length);
      if (i === KINDS.length - 1) setRound((r) => r + 1);
    }, 4200);
    return () => clearTimeout(id);
  }, [i, locked, reduce]);

  return (
    <section aria-labelledby="empty-hero" className="pt-6 md:pt-10">
      <p className="mb-4 text-[15px] font-medium text-ink-muted">{dateLine}</p>

      <m.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="paper-keep relative grid overflow-hidden rounded-[28px] shadow-[0_40px_80px_-48px_rgba(40,25,5,.55),0_0_0_1px_rgba(26,26,26,.06)] md:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="relative min-h-[320px] overflow-hidden md:min-h-[380px]">
          <AnimatePresence initial={false}>
            <m.div
              key={kind.key}
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="absolute inset-0"
            >
              <EventArt accent={kind.accent} seed={`empty-${kind.key}-${round}`} scrim={false} />
            </m.div>
          </AnimatePresence>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_15%,rgba(0,0,0,.66)_100%)]" />
          <div className="relative flex h-full min-h-[320px] flex-col justify-end p-6 text-[#FFFEF6] md:min-h-[380px] md:p-9">
            <p className="text-[14px] font-semibold text-[#FFFEF6]/85">Your first pass</p>
            <h1 id="empty-hero" className="mt-2 min-h-[2em] max-w-[14ch] font-display text-[clamp(40px,5.6vw,76px)] leading-[0.95] tracking-[-0.03em]">
              <span className="sr-only">Your first pass is waiting for an event.</span>
              <span aria-hidden>
                {typed}
                <span className="ml-1 inline-block h-[0.8em] w-[3px] translate-y-[0.06em] bg-[#FFFEF6] motion-safe:animate-[caret_1s_steps(1)_infinite]" />
              </span>
            </h1>
            <dl className="mt-5 grid max-w-[520px] grid-cols-3 gap-4 text-[13px] text-[#FFFEF6]/70">
              <div>
                <dt>Admit one</dt>
                <dd className="mt-0.5 truncate text-[15.5px] font-semibold text-[#FFFEF6]">{name}</dd>
              </div>
              <div>
                <dt>When</dt>
                <dd className="mt-0.5 text-[15.5px] font-semibold text-[#FFFEF6]">You pick</dd>
              </div>
              <div>
                <dt>Kind</dt>
                <dd className="mt-0.5 text-[15.5px] font-semibold text-[#FFFEF6]">{kind.label}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="hero-stub relative flex flex-col justify-between bg-[#FFFEF6] p-6 md:p-7">
          <div>
            <p className="text-[13.5px] font-medium text-[#6A6A6A]">Doors open in</p>
            <p className="mt-1 flex items-baseline gap-2 text-[#C9C2AE]">
              <span className="font-display text-[104px] leading-[0.8] tracking-[-0.05em] tabular-nums">00</span>
              <span className="font-display text-[28px]">days</span>
            </p>
            <p className="mt-3 font-mono text-[20px] tracking-[0.04em] text-[#C9C2AE]">00:00:00</p>
          </div>
          <div className="mt-8">
            <Link
              href={`/events?type=${kind.key}`}
              className="flex h-12 items-center justify-center rounded-xl bg-[#F0D7FF] text-[15.5px] font-semibold text-[#1A1A1A] ring-2 ring-inset ring-[#1A1A1A] transition-transform active:scale-[0.98]"
            >
              Find {kind.label.toLowerCase()}
            </Link>
            <Link href="/host" className="mt-3 block text-center text-[14px] font-semibold text-[#3F3F3F] underline decoration-[#C9C2AE] underline-offset-4 hover:text-[#1A1A1A]">
              Or host your own
            </Link>
          </div>
        </div>
      </m.div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[14px] font-semibold text-ink">What are you into?</span>
        {KINDS.map((k, n) => (
          <button
            key={k.key}
            type="button"
            aria-pressed={locked && i === n}
            onClick={() => {
              setI(n);
              setLocked(true);
            }}
            className={cn(
              "relative h-9 overflow-hidden rounded-lg px-3.5 text-[14px] font-medium transition-colors",
              i === n ? "bg-ink text-white" : "bg-sunken text-ink-2 hover:text-ink",
            )}
          >
            {k.label}
            {i === n && !locked && !reduce && (
              <span key={`${k.key}-${round}`} aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-white/60 motion-safe:animate-[chip-timer_4.2s_linear_forwards]" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
