"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLogo, BrandMark } from "@/components/site/Brand";
import { cn } from "@/lib/utils";

type Phase = "idle" | "warm" | "feed" | "tear";

const TICKETS = [
  { title: "Sunset Sessions", tag: "Couple", accent: "#4B2E86" },
  { title: "RoboWars 2026", tag: "Team Byte Me", accent: "#2346A8" },
  { title: "Garba Night", tag: "Stag", accent: "#C7457A" },
  { title: "Box Cricket", tag: "Strikers XI", accent: "#11796D" },
];
const CONFETTI = ["#E3264F", "#F0D7FF", "#FFD27A", "#5EE0A8", "#8FBAFF", "#E3264F", "#F0D7FF", "#FFD27A"];

/** A stable QR-looking pattern for a seed: finder squares in three corners, dots elsewhere. */
function qrCells(seed: number) {
  const n = 9;
  const cells: boolean[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
      const ring = finder && !((x % 6 === 1 || x === 7) && (y % 6 === 1 || y === 7));
      cells.push(finder ? ring || (x % 6 === 1 && y % 6 === 1) || (x === 7 && y === 1) || (x === 1 && y === 7) : ((x * 7 + y * 13 + seed * 5) % 5) < 2);
    }
  return cells;
}

function Ticket({ n, className, style }: { n: number; className?: string; style?: React.CSSProperties }) {
  const t = TICKETS[n % TICKETS.length];
  return (
    <div className={cn("paper-keep hp-paper absolute inset-x-0 bottom-0 mx-auto w-[118px] px-3 pb-4 pt-3", className)} style={style}>
      <div className="flex items-center justify-between">
        <BrandMark className="size-3.5" />
        <span className="text-[8.5px] font-semibold text-ink-muted">Admit one</span>
      </div>
      <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: t.accent }} />
      <p className="mt-2 font-display text-[15px] leading-[1.05] text-ink">{t.title}</p>
      <p className="mt-1 text-[8.5px] font-semibold text-ink-2">{t.tag}</p>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="grid size-[38px] grid-cols-9 gap-[0.5px]">
          {qrCells(n).map((on, k) => (
            <span key={k} className={on ? "bg-ink" : ""} />
          ))}
        </div>
        <span className="font-mono text-[7.5px] leading-tight tabular-nums text-ink-muted">
          No. {String(41 + n).padStart(4, "0")}
          <br />
          Sat 12 Dec
        </span>
      </div>
      <div className="mt-2.5 border-t border-dashed border-line-strong" />
    </div>
  );
}

/**
 * The hero's thermal printer. Press it: the LED warms up, the motor hums, the print head glows,
 * the ticket feeds out line by line, tears off at the zigzag, lands on the pile, and a little
 * confetti pops. Example tickets; nothing is saved.
 */
export function MiniPrinter() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0); // tickets printed and torn off
  const [burst, setBurst] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const print = () => {
    if (phase !== "idle") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, reduce ? 0 : ms));
    setPhase("warm");
    try {
      navigator.vibrate?.([8, 30, 8, 30, 8]);
    } catch {}
    at(380, () => setPhase("feed"));
    at(380 + 1500, () => {
      setPhase("tear");
      try {
        navigator.vibrate?.(18);
      } catch {}
    });
    at(380 + 1500 + 520, () => {
      setCount((c) => c + 1);
      setBurst((b) => b + 1);
      setPhase("idle");
    });
  };

  const busy = phase !== "idle";
  const pile = Array.from({ length: Math.min(count, 3) }, (_, i) => count - Math.min(count, 3) + i);

  return (
    <div className="flex w-[160px] flex-col items-center justify-self-center sm:w-[150px]">
      {/* Paper area: the pile of torn tickets, and the one printing now. */}
      <div className="relative h-[178px] w-full" aria-hidden>
        {pile.map((n, i) => {
          const depth = pile.length - 1 - i;
          return (
            <Ticket
              key={n}
              n={n}
              className={cn("hp-pile", depth === 0 && burst && "hp-land")}
              style={{ transform: `translate(${(n % 2 ? 1 : -1) * (6 + depth * 3)}px, ${-14 - depth * 5}px) rotate(${(n % 2 ? 1 : -1) * (4 + depth * 2)}deg)`, opacity: 1 - depth * 0.18, zIndex: i }}
            />
          );
        })}
        {/* The slot clips the ticket while it feeds, so it really comes out of the printer. */}
        <div className="absolute inset-x-0 bottom-0 h-[178px] overflow-hidden" style={{ zIndex: 5 }}>
          {(phase === "feed" || phase === "tear") && <Ticket n={count} className={cn("hp-feeding", phase === "tear" && "hp-tearing")} />}
        </div>
        {/* Confetti from the slot when a ticket lands. */}
        {burst > 0 && (
          <div key={burst} className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="hp-confetti absolute size-[5px] rounded-[1px]"
                style={{ background: c, "--dx": `${(i - 3.5) * 16}px`, "--dy": `${-60 - (i % 3) * 22}px`, "--r": `${(i % 2 ? 1 : -1) * (160 + i * 30)}deg`, animationDelay: `${i * 12}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>

      {/* The printer */}
      <div className={cn("relative z-[6] w-full", busy && phase !== "tear" && "hp-hum")}>
        <div className="relative rounded-[20px] bg-[linear-gradient(180deg,#2a2a2a,#151515)] p-3 pt-2.5 shadow-[0_24px_44px_-20px_rgba(26,26,26,0.75),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-2px_0_rgba(0,0,0,0.5)]">
          {/* Slot with the print head */}
          <div className="relative mx-auto h-2 w-[86%] overflow-hidden rounded-full bg-black shadow-[inset_0_1px_3px_rgba(0,0,0,0.95)]">
            <span className={cn("absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[linear-gradient(90deg,transparent,#F0D7FF,transparent)] opacity-0", phase === "feed" && "hp-head")} />
          </div>
          {/* Tear bar */}
          <div className="mx-auto mt-1 h-[3px] w-[90%] rounded-full bg-[repeating-linear-gradient(90deg,#3a3a3a_0_3px,#202020_3px_6px)]" aria-hidden />
          <div className="mt-2.5 flex items-center justify-between">
            <BrandLogo tone="white" className="text-[11px]" />
            <span className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold tabular-nums text-white/45">{String(count).padStart(3, "0")}</span>
              <span
                className={cn(
                  "size-[7px] rounded-full transition-colors duration-200",
                  phase === "idle" ? (count ? "bg-[#5EE0A8] shadow-[0_0_8px_#5EE0A8]" : "bg-brand shadow-[0_0_6px_#E3264F]") : phase === "warm" ? "hp-blink bg-[#FFC266] shadow-[0_0_8px_#FFC266]" : "bg-[#FFC266] shadow-[0_0_10px_#FFC266]",
                )}
                aria-hidden
              />
            </span>
          </div>
          <button
            type="button"
            onClick={print}
            disabled={busy}
            className="mt-2.5 h-10 w-full rounded-[12px] bg-lavender text-[13.5px] font-semibold text-ink shadow-[inset_0_-3px_0_rgba(26,26,26,0.18),0_1px_0_rgba(255,255,255,0.1)] transition-[transform,box-shadow,background-color] duration-100 hover:bg-lavender-hover active:translate-y-[2px] active:shadow-[inset_0_-1px_0_rgba(26,26,26,0.18)] disabled:cursor-default disabled:opacity-80"
          >
            {phase === "warm" ? "Warming up…" : phase === "feed" ? "Printing…" : phase === "tear" ? "Tearing…" : count ? "Print another" : "Print a pass"}
          </button>
        </div>
        {/* Feet */}
        <div className="mx-auto flex w-[78%] justify-between" aria-hidden>
          <span className="h-1.5 w-5 rounded-b-md bg-[#111]" />
          <span className="h-1.5 w-5 rounded-b-md bg-[#111]" />
        </div>
      </div>
      <span className="sr-only" role="status">
        {count ? `Printed ${count} example ${count === 1 ? "pass" : "passes"}.` : ""}
      </span>
    </div>
  );
}
