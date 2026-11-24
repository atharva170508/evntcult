"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/site/Brand";
import { Odometer } from "@/components/ui/Odometer";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/motion/MotionProvider";

type Phase = "idle" | "warm" | "feed" | "tear";

const TICKETS = [
  { title: "Sunset Sessions", tag: "Couple", venue: "Riverside Lawn", accent: "#5A3BA8", gold: false },
  { title: "HackNight '26", tag: "Team Byte Me", venue: "Main Auditorium", accent: "#2346A8", gold: false },
  { title: "Garba Night", tag: "Stag entry", venue: "Central Quad", accent: "#C7457A", gold: false },
  { title: "Box Cricket", tag: "Strikers XI", venue: "North Turf", accent: "#11796D", gold: false },
  { title: "Synth Lawn", tag: "VIP pass", venue: "Amphitheatre", accent: "#D6652A", gold: false },
];

const SECRET_TICKETS: Record<number, { title: string; tag: string; venue: string; accent: string; gold: boolean }> = {
  4: { title: "Free Samosa", tag: "Rare drop", venue: "Canteen Back Door", accent: "#C6861E", gold: true },
  7: { title: "VIP Backstage", tag: "Act casual", venue: "Green Room", accent: "#E3264F", gold: true },
  11: { title: "Touch Grass", tag: "Mandatory", venue: "Outside Campus", accent: "#11796D", gold: true },
};

const CONFETTI = ["#E3264F", "#F0D7FF", "#FFD27A", "#5EE0A8", "#8FBAFF", "#E3264F", "#F0D7FF", "#FFD27A", "#1A1A1A", "#5EE0A8"];

/** Synthesize subtle mechanical printer sounds via Web Audio API (zero external files). */
function playSound(kind: "click" | "step" | "tear", ctxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    if (kind === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (kind === "step") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(320 + Math.random() * 60, now);
      gain.gain.setValueAtTime(0.014, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (kind === "tear") {
      const len = Math.floor(ctx.sampleRate * 0.14);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(5200, now + 0.13);
      filter.Q.value = 1.4;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(now);
    }
  } catch {
    // Audio unavailable or blocked
  }
}

/** A stable QR-looking pattern for a seed: finder squares in three corners, dots elsewhere. */
function qrCells(seed: number) {
  const n = 9;
  const cells: boolean[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
      const ring = finder && !((x % 6 === 1 || x === 7) && (y % 6 === 1 || y === 7));
      cells.push(
        finder
          ? ring || (x % 6 === 1 && y % 6 === 1) || (x === 7 && y === 1) || (x === 1 && y === 7)
          : ((x * 7 + y * 13 + seed * 5) % 5) < 2,
      );
    }
  return cells;
}

function Ticket({
  n,
  className,
  style,
  printing = false,
}: {
  n: number;
  className?: string;
  style?: React.CSSProperties;
  printing?: boolean;
}) {
  const t = SECRET_TICKETS[n] ?? TICKETS[n % TICKETS.length];
  return (
    <div
      className={cn(
        "paper-keep hp-paper absolute inset-x-0 bottom-0 mx-auto w-[124px] px-3 pb-4 pt-3",
        t.gold && "ring-2 ring-[#D69E2E]/80",
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between">
        <BrandMark className="size-3.5" />
        <span
          className={cn(
            "font-mono text-[7.5px] font-semibold tracking-[0.04em]",
            t.gold ? "text-[#A66A00]" : "text-ink-muted",
          )}
        >
          {t.gold ? "RARE" : "ADMIT 1"}
        </span>
      </div>
      <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: t.accent }} />
      <p className="mt-2 font-display text-[15.5px] leading-[1.05] text-ink">{t.title}</p>
      <p className="mt-0.5 truncate text-[8.5px] font-semibold text-ink-2">
        {t.tag} · {t.venue}
      </p>
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
      {printing && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-ink/10 to-transparent"
        />
      )}
    </div>
  );
}

/**
 * Teenage-Engineering-inspired tactile thermal ticket printer.
 * Press the sculpted keycap: mechanical click, warm-up LED pulse, OLED status readout,
 * stepper-motor thermal feed with 3D paper curl, serrated blade glint & tear snap,
 * spring-settled fanned ticket stack you can hover to fan out, plus optional synthesized audio.
 */
export function MiniPrinter() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0);
  const [burst, setBurst] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [fanOpen, setFanOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const print = () => {
    if (phase !== "idle") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (soundOn) playSound("click", audioCtx);
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, reduce ? 0 : ms));

    setPhase("warm");
    try {
      navigator.vibrate?.([8, 25, 8]);
    } catch {}

    at(340, () => {
      setPhase("feed");
      if (soundOn && !reduce) {
        // 10 crisp stepper ticks synced to the paper feed
        for (let i = 0; i < 10; i++) {
          at(340 + i * 125, () => playSound("step", audioCtx));
        }
      }
    });

    at(340 + 1350, () => {
      setPhase("tear");
      if (soundOn) playSound("tear", audioCtx);
      try {
        navigator.vibrate?.(20);
      } catch {}
    });

    at(340 + 1350 + 480, () => {
      setCount((c) => {
        const next = c + 1;
        if (next === 5) toast("Rare drop: Free Samosa Coupon printed.", { tone: "ok" });
        else if (next === 8) toast("Printer is begging for mercy. Here's a VIP pass.", { tone: "info" });
        else if (next === 12) toast("12 passes printed. Go touch some campus grass.", { tone: "info" });
        return next;
      });
      setBurst((b) => b + 1);
      setPhase("idle");
    });
  };

  const busy = phase !== "idle";
  const pile = Array.from({ length: Math.min(count, 4) }, (_, i) => count - Math.min(count, 4) + i);

  const oledText =
    phase === "warm"
      ? count >= 7
        ? "HOT!!"
        : "HEATING"
      : phase === "feed"
        ? count >= 9
          ? "LOW PAPR"
          : "FEEDING"
        : phase === "tear"
          ? "TEAR"
          : count >= 7
            ? "CHILL"
            : count > 0
              ? "READY"
              : "IDLE";

  return (
    <div className="flex w-[172px] flex-col items-center justify-self-center sm:w-[162px]">
      {/* Paper tray: collapses cleanly on mobile while empty */}
      <div
        onPointerEnter={() => count > 0 && setFanOpen(true)}
        onPointerLeave={() => setFanOpen(false)}
        onClick={() => {
          if (count > 0 && phase === "idle") {
            toast("Nice stack. Still only gets you into one gig at a time.", { tone: "info" });
          }
        }}
        className={cn(
          "relative w-full transition-[height] duration-300 ease-out sm:h-[186px]",
          count > 0 && phase === "idle" && "cursor-pointer",
          count === 0 && phase === "idle" ? "h-4" : "h-[186px]",
        )}
        style={{ perspective: 600 }}
        aria-hidden
      >
        {/* Fanned stack of printed tickets — hover to spread the stack */}
        <AnimatePresence>
          {pile.map((n, i) => {
            const depth = pile.length - 1 - i;
            const dir = n % 2 ? 1 : -1;
            const spreadX = fanOpen ? dir * (14 + depth * 11) : dir * (6 + depth * 3.5);
            const spreadY = fanOpen ? -20 - depth * 9 : -14 - depth * 5;
            const spreadRot = fanOpen ? dir * (8 + depth * 4) : dir * (4 + depth * 2);
            return (
              <m.div
                key={n}
                initial={reduce ? false : { y: -26, scale: 0.96, rotate: -6, opacity: 0.9 }}
                animate={{
                  x: spreadX,
                  y: spreadY,
                  rotate: spreadRot,
                  scale: 1 - depth * 0.03,
                  opacity: fanOpen ? 1 - depth * 0.08 : 1 - depth * 0.16,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute inset-x-0 bottom-0"
                style={{ zIndex: i }}
              >
                <Ticket n={n} />
              </m.div>
            );
          })}
        </AnimatePresence>

        {/* Slot clipping mask: ticket feeds upward with authentic 3D forward paper curl */}
        <div
          className="absolute inset-x-0 bottom-0 h-[186px] overflow-hidden"
          style={{ zIndex: 6, perspective: 500 }}
        >
          <AnimatePresence>
            {(phase === "feed" || phase === "tear") && (
              <m.div
                key={`active-${count}`}
                initial={reduce ? { y: 0 } : { y: 178, rotateX: -14 }}
                animate={
                  phase === "tear"
                    ? { y: -18, x: -7, rotate: -5.5, rotateX: 4, opacity: 0.96 }
                    : { y: 0, rotateX: 0 }
                }
                exit={{ opacity: 0 }}
                transition={
                  phase === "tear"
                    ? { duration: 0.44, ease: EASE }
                    : {
                        duration: 1.32,
                        ease: [0.22, 0.9, 0.32, 1],
                      }
                }
                className="absolute inset-x-0 bottom-0 origin-bottom"
              >
                <Ticket n={count} printing={phase === "feed"} />
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* Crisp metallic tear-blade glint across the slot */}
        <AnimatePresence>
          {phase === "tear" && !reduce && (
            <m.span
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "120%", opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.36, ease: EASE }}
              className="pointer-events-none absolute inset-x-3 bottom-0 z-10 h-[3px] rounded-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_10px_rgba(255,255,255,0.9)]"
            />
          )}
        </AnimatePresence>

        {/* Confetti + paper flecks popping out of the tear bar */}
        {burst > 0 && !reduce && (
          <div key={burst} className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="hp-confetti absolute size-[5px] rounded-[1px]"
                style={
                  {
                    background: c,
                    "--dx": `${(i - 4.5) * 15}px`,
                    "--dy": `${-64 - (i % 3) * 24}px`,
                    "--r": `${(i % 2 ? 1 : -1) * (180 + i * 32)}deg`,
                    animationDelay: `${i * 10}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Tactile hardware chassis */}
      <m.div
        animate={
          busy && !reduce
            ? phase === "tear"
              ? { y: [0, 2, 0], rotate: [0, -0.8, 0] }
              : { y: [0, 0.7, 0] }
            : { y: 0, rotate: 0 }
        }
        transition={
          phase === "tear"
            ? { duration: 0.24, ease: EASE }
            : { repeat: busy ? Infinity : 0, duration: 0.14 }
        }
        className="relative z-[8] w-full"
      >
        <div className="relative rounded-[22px] bg-[linear-gradient(180deg,#2e2d2b_0%,#1c1b1a_55%,#131211_100%)] p-3 pt-2.5 shadow-[0_28px_48px_-20px_rgba(26,26,26,0.8),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_0_rgba(0,0,0,0.6)]">
          {/* Paper slot with animated thermal print-head beam */}
          <div className="relative mx-auto h-2.5 w-[88%] overflow-hidden rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.95)]">
            <m.span
              aria-hidden
              animate={
                phase === "feed" && !reduce
                  ? { x: ["-60%", "140%"], opacity: [0.35, 1, 0.35] }
                  : phase === "warm"
                    ? { x: "20%", opacity: [0.2, 0.8, 0.2] }
                    : { opacity: 0 }
              }
              transition={{ repeat: Infinity, duration: phase === "feed" ? 0.55 : 0.4, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[linear-gradient(90deg,transparent,#F0D7FF,#E3264F,transparent)]"
            />
          </div>

          {/* Serrated metallic tear bar */}
          <div
            className="mx-auto mt-1 h-[3px] w-[90%] rounded-full bg-[repeating-linear-gradient(90deg,#52504c_0_2px,#1d1c1a_2px_5px)]"
            aria-hidden
          />

          {/* Top faceplate: Brand + miniature OLED status + rolling odometer + sound toggle */}
          <div className="mt-2.5 flex items-center justify-between gap-1">
            <BrandLogo tone="white" className="text-[11px]" />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                aria-label={soundOn ? "Mute printer sound" : "Unmute printer sound"}
                title={soundOn ? "Sound on" : "Muted"}
                className="grid size-4 place-items-center rounded text-white/40 transition-colors hover:text-white/80"
              >
                {soundOn ? <Volume2 className="size-3" aria-hidden /> : <VolumeX className="size-3" aria-hidden />}
              </button>
              <span className="inline-flex items-center font-mono text-[9.5px] font-semibold tabular-nums text-white/55">
                {count < 10 ? "00" : count < 100 ? "0" : ""}
                <Odometer value={count} />
              </span>
              <span
                className={cn(
                  "size-[7px] rounded-full transition-colors duration-200",
                  phase === "idle"
                    ? count
                      ? "bg-[#5EE0A8] shadow-[0_0_8px_#5EE0A8]"
                      : "bg-brand shadow-[0_0_6px_#E3264F]"
                    : phase === "warm"
                      ? "hp-blink bg-[#FFC266] shadow-[0_0_8px_#FFC266]"
                      : "bg-[#F0D7FF] shadow-[0_0_10px_#F0D7FF]",
                )}
                aria-hidden
              />
            </div>
          </div>

          {/* Miniature recessed OLED status strip */}
          <div className="mt-2 flex items-center justify-between rounded-md bg-black/65 px-2 py-1 font-mono text-[8.5px] tracking-[0.08em] text-white/60 ring-1 ring-inset ring-white/[0.06]">
            <span className={cn(busy && "text-[#F0D7FF]")}>{oledText}</span>
            <span className="truncate pl-2 text-white/40">
              {TICKETS[count % TICKETS.length].title.split(" ")[0]}
            </span>
          </div>

          {/* Sculpted tactile lavender keycap */}
          <button
            type="button"
            onClick={print}
            disabled={busy}
            className="mt-2.5 h-10 w-full rounded-[12px] bg-lavender text-[13.5px] font-semibold text-ink shadow-[0_3px_0_#0b0a0a,inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-2px_0_rgba(26,26,26,0.14)] transition-[transform,box-shadow,background-color] duration-100 hover:bg-lavender-hover active:translate-y-[3px] active:shadow-[0_0_0_#0b0a0a,inset_0_1px_2px_rgba(26,26,26,0.2)] disabled:cursor-default disabled:opacity-85"
          >
            {phase === "warm"
              ? "Warming…"
              : phase === "feed"
                ? "Printing…"
                : phase === "tear"
                  ? "Snapping…"
                  : count
                    ? "Print another"
                    : "Print a pass"}
          </button>
        </div>

        {/* Rubber feet */}
        <div className="mx-auto flex w-[76%] justify-between" aria-hidden>
          <span className="h-1.5 w-5 rounded-b-md bg-[#0e0d0c]" />
          <span className="h-1.5 w-5 rounded-b-md bg-[#0e0d0c]" />
        </div>
      </m.div>

      <span className="sr-only" role="status">
        {count ? `Printed ${count} example ${count === 1 ? "pass" : "passes"}.` : ""}
      </span>
    </div>
  );
}
