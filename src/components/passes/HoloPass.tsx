"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  m,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  CheckCircle2,
  Hourglass,
  Maximize2,
  Navigation,
  RotateCw,
  Share2,
  Sun,
  X,
} from "lucide-react";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { svgSrc } from "@/lib/svg-src";
import { cn } from "@/lib/utils";
import { passName } from "@/lib/pass-name";

export interface HoloPassProps {
  regId: string;
  slug: string;
  title: string;
  weekday: string;
  day: string;
  month: string;
  time: string;
  timeRange: string;
  venue: string;
  holder: string;
  passCode: string;
  serial: string;
  /** Designed QR (round-cornered modules, ink gradient, centre mark). Same payload as the plain one. */
  qrArt: string | null;
  accent: string;
  ink: string;
  seed: string;
  state: "confirmed" | "live" | "waitlist" | "cancelled";
  waitlistNote?: string | null;
  pay?: { text: string; tone: "ok" | "warn"; href?: string } | null;
  admittedAt?: string | null;
  startsAt: string;
  endsAt: string;
  /** Google Maps directions to the venue, when there's a real place. */
  directions?: string | null;
  /** Answers the gate and food counter read: food, size, team. */
  logistics?: { label: string; value: string }[];
}

/** Ticks once a second, but only while the event is within 2 hours or on. Null until mounted. */
function useSoon(startsAt: string, endsAt: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const start = Date.parse(startsAt);
    const id = setInterval(
      () => {
        const t = Date.now();
        setNow(t);
        if (t > Date.parse(endsAt)) clearInterval(id);
      },
      start - Date.now() < 2 * 3_600_000 + 60_000 ? 1000 : 30_000,
    );
    return () => clearInterval(id);
  }, [startsAt, endsAt]);
  if (now === null) return null;
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (now >= end || start - now > 2 * 3_600_000) return null;
  if (now >= start) return { live: true, label: "Happening now" };
  const left = Math.max(0, Math.floor((start - now) / 1000));
  const h = Math.floor(left / 3600);
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return {
    live: false,
    label: `Starts in ${h ? `${h}:${mm}` : Number(mm)}:${ss}`,
  };
}

/** Short label for a logistics answer: "Food preference" -> "Food". */
const shortLabel = (l: string) =>
  /food|diet|meal/i.test(l)
    ? "Food"
    : /size|t-?shirt|hoodie/i.test(l)
      ? "Size"
      : /team/i.test(l)
        ? "Team"
        : /jersey/i.test(l)
          ? "No."
          : /pass type|ticket type/i.test(l)
            ? "Pass"
            : l.split(/\s+/)[0];

/**
 * An event badge on a lanyard. It hangs, swings a little when it arrives, tilts toward the
 * pointer so the holographic strip catches the light, and flips for the back. "Show at the
 * gate" takes the QR flat and full screen, so scanning never fights the tilt.
 */
export function HoloPass(p: HoloPassProps) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [gate, setGate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tone = accentHex(p.accent);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.4);
  const sx = useSpring(px, { stiffness: 150, damping: 20, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 150, damping: 20, mass: 0.7 });
  const rotY = useTransform(sx, [0, 1], [-8, 8]);
  const rotX = useTransform(sy, [0, 1], [6, -6]);
  const sway = useTransform(sx, [0, 1], [2.5, -2.5]);
  const lx = useTransform(sx, (v) => `${v * 100}%`);
  const ly = useTransform(sy, (v) => `${v * 100}%`);
  const hue = useTransform(sx, [0, 1], [0, 160]);
  const shadowX = useTransform(sx, [0, 1], [16, -16]);
  const glare = useMotionTemplate`radial-gradient(circle at ${lx} ${ly}, rgba(255,255,255,0.5), rgba(255,255,255,0) 45%)`;
  const holo = useMotionTemplate`linear-gradient(${hue}deg, #ff9ec4, #ffe08a, #9ef5cf, #8fbaff, #d6b4ff, #ff9ec4)`;

  function move(e: React.PointerEvent) {
    if (reduce || e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function leave() {
    px.set(0.5);
    py.set(0.4);
  }

  const canEnter = (p.state === "confirmed" || p.state === "live") && !!p.qrArt;
  const soon = useSoon(p.startsAt, p.endsAt);
  // The stub tears away once per pass, the first time you see it checked in; after that it stays torn.
  const [torn, setTorn] = useState(false);
  const [tearAnim, setTearAnim] = useState(false);
  useEffect(() => {
    if (!p.admittedAt) return;
    const key = `ec_torn_${p.regId}`;
    let seen = false;
    try {
      seen = localStorage.getItem(key) === "1";
      localStorage.setItem(key, "1");
    } catch {
      // private mode: just play it
    }
    setTearAnim(!seen && !reduce);
    setTorn(true);
  }, [p.admittedAt, p.regId, reduce]);

  // Phones: tilt follows the gyroscope (smoothed by the same springs as the pointer).
  const gyroAsked = useRef(false);
  useEffect(() => {
    if (
      reduce ||
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    )
      return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    let last: DeviceOrientationEvent | null = null;
    const onTilt = (e: DeviceOrientationEvent) => {
      last = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (last?.gamma == null || last.beta == null) return;
        px.set(0.5 + Math.max(-0.5, Math.min(0.5, last.gamma / 36)));
        py.set(0.4 + Math.max(-0.4, Math.min(0.4, (last.beta - 50) / 60)));
      });
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      cancelAnimationFrame(frame);
    };
  }, [reduce, px, py]);
  // iPhone asks permission for motion data, and only from a tap.
  function askGyro() {
    if (gyroAsked.current) return;
    gyroAsked.current = true;
    const D = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    void D.requestPermission?.().catch(() => undefined);
  }
  const artRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const access =
    p.state === "waitlist"
      ? "Waitlist"
      : p.state === "cancelled"
        ? "Cancelled"
        : "Attendee";

  return (
    <article
      aria-label={`Pass for ${p.title}`}
      className="flex w-full flex-col items-center"
    >
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        onPointerDown={(e) => e.pointerType === "touch" && askGyro()}
        className="paper-keep relative w-full max-w-[340px] [perspective:1400px]"
      >
        {/* Hangs from the top: a short swing when it arrives, then follows the pointer. */}
        <m.div
          className="origin-top"
          initial={reduce ? false : { rotate: 6 }}
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 55, damping: 5, mass: 0.9 }}
        >
          <m.div
            className="origin-top"
            style={reduce ? undefined : { rotate: sway }}
          >
            <Lanyard tone={tone} />

            <div className="relative -mt-[22px]">
              <m.div
                aria-hidden
                className="absolute inset-x-10 -bottom-6 h-10 rounded-[50%] bg-[rgba(60,40,10,0.28)] blur-xl"
                style={reduce ? undefined : { x: shadowX }}
              />
              <m.div
                style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }}
                className="relative [transform-style:preserve-3d]"
              >
                <m.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 130, damping: 17 }
                  }
                  className="relative grid [transform-style:preserve-3d]"
                  onDoubleClick={() => setFlipped((f) => !f)}
                >
                  {/* ---------------- Front ---------------- */}
                  <div
                    className={cn(
                      "col-start-1 row-start-1 [backface-visibility:hidden]",
                      flipped && "pointer-events-none",
                    )}
                    aria-hidden={flipped}
                    inert={flipped}
                  >
                    <div className="relative">
                      <Card part="top">
                        {/* Artwork header with the lanyard slot punched through it */}
                        <div
                          ref={artRef}
                          className="relative h-[176px] overflow-hidden"
                        >
                          <EventArt accent={p.accent} seed={p.seed} />
                          {!reduce && (
                            <m.div
                              aria-hidden
                              className="absolute inset-0 mix-blend-soft-light"
                              style={{ background: glare }}
                            />
                          )}
                          <span
                            aria-hidden
                            className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
                          />
                          <Slot />
                          {p.state === "live" && (
                            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-ink">
                              <span
                                className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
                                aria-hidden
                              />{" "}
                              Live now
                            </span>
                          )}
                          <h2 className="absolute inset-x-5 bottom-4 font-display text-[30px] leading-[1.02] tracking-[-0.02em] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.25)]">
                            {p.title}
                          </h2>
                        </div>

                        <div className="relative flex">
                          {/* Holographic security strip */}
                          <m.div
                            aria-hidden
                            className="w-2.5 shrink-0 opacity-80"
                            style={
                              reduce
                                ? {
                                    background:
                                      "linear-gradient(#ff9ec4,#ffe08a,#9ef5cf,#8fbaff,#d6b4ff)",
                                  }
                                : { background: holo }
                            }
                          />
                          <div className="min-w-0 flex-1 px-5 pb-4 pt-4">
                            <span
                              className="inline-flex rounded-md px-2 py-0.5 text-[12px] font-semibold"
                              style={{
                                background: `${tone}18`,
                                color:
                                  p.state === "cancelled" ? "#C0392B" : p.ink,
                              }}
                            >
                              {access}
                            </span>
                            <p className="mt-2 truncate font-display text-[27px] leading-tight text-ink">
                              {p.holder}
                            </p>
                            <dl className="mt-4 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-5">
                              <Info
                                k="Date"
                                v={`${p.weekday} ${p.day} ${p.month}`}
                              />
                              <Info k="Time" v={p.time} />
                              <Info k="Venue" v={p.venue} truncate />
                            </dl>
                            {p.admittedAt && (
                              <Stamp
                                color={p.ink}
                                time={p.admittedAt}
                                animate={!reduce}
                              />
                            )}
                          </div>
                        </div>
                        <Notches edge="bottom" torn={torn} />
                      </Card>

                      {/* Stub: the QR is the point of the whole thing. Tears away when you're checked in. */}
                      <m.div
                        className="relative origin-top-left"
                        initial={false}
                        animate={
                          torn
                            ? { y: 26, rotate: 2.4, opacity: 0.82 }
                            : { y: 0, rotate: 0, opacity: 1 }
                        }
                        transition={
                          tearAnim
                            ? {
                                type: "spring",
                                stiffness: 120,
                                damping: 14,
                                delay: 0.25,
                              }
                            : { duration: 0 }
                        }
                      >
                        <Card part="bottom">
                          <Notches edge="top" torn={torn} />
                          <div className="relative flex flex-col items-center px-5 pb-6 pt-5">
                            {soon && canEnter && (
                              <div className="mb-4 w-full space-y-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[14px] font-semibold tabular-nums",
                                      p.admittedAt
                                        ? "bg-live text-white"
                                        : soon.live
                                          ? "bg-accent text-white"
                                          : "bg-ink text-white",
                                    )}
                                    role="timer"
                                  >
                                    {soon.live && !p.admittedAt && (
                                      <span
                                        className="size-1.5 rounded-full bg-white motion-safe:animate-pulse"
                                        aria-hidden
                                      />
                                    )}
                                    {p.admittedAt ? `Checked in at ${p.admittedAt}` : soon.label}
                                  </span>
                                  {p.directions && (
                                    <a
                                      href={p.directions}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-[13.5px] font-semibold text-ink transition-colors duration-fast hover:border-ink"
                                    >
                                      <Navigation
                                        className="size-4"
                                        aria-hidden
                                      />{" "}
                                      Directions
                                    </a>
                                  )}
                                </div>
                                {!!p.logistics?.length && (
                                  <LogisticsPills
                                    items={p.logistics}
                                    ink={p.ink}
                                  />
                                )}
                              </div>
                            )}
                            {canEnter ? (
                              <button
                                type="button"
                                onClick={() => setGate(true)}
                                className="group relative rounded-[20px] bg-white p-3 shadow-[0_0_0_1px_#E7E2D4,0_8px_20px_-10px_rgba(60,40,10,0.25)] transition-shadow duration-fast hover:shadow-[0_0_0_1px_#DCD6C6,0_12px_28px_-12px_rgba(60,40,10,0.35)]"
                                aria-label="Show the QR code full screen for the gate"
                              >
                                <Brackets color={p.ink} />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={svgSrc(p.qrArt!)}
                                  alt={`QR code for pass ${p.passCode}`}
                                  className="block size-[168px]"
                                />
                              </button>
                            ) : (
                              <div className="grid size-[192px] place-items-center rounded-[20px] border border-dashed border-line-strong bg-sunken/50 p-5 text-center text-[13px] text-ink-muted">
                                <span>
                                  <Hourglass
                                    className="mx-auto mb-2 size-5"
                                    aria-hidden
                                  />
                                  {p.waitlistNote ??
                                    (p.state === "cancelled"
                                      ? "This event was cancelled."
                                      : "No QR yet.")}
                                </span>
                              </div>
                            )}
                            <p className="mt-3 text-center">
                              <span className="block font-display text-[22px] leading-tight text-ink">{passName(p.passCode).name}</span>
                              <span className="block text-[12.5px] tabular-nums text-ink-muted">No. {passName(p.passCode).no}</span>
                            </p>
                            {p.pay &&
                              (p.pay.href ? (
                                <Link
                                  href={p.pay.href}
                                  className="mt-2 rounded-md bg-warn-soft px-2.5 py-1 text-[12.5px] font-semibold text-warn underline-offset-2 hover:underline"
                                >
                                  {p.pay.text}
                                </Link>
                              ) : (
                                <span
                                  className={cn(
                                    "mt-2 rounded-md px-2.5 py-1 text-[12.5px] font-semibold",
                                    p.pay.tone === "ok"
                                      ? "bg-live-soft text-live"
                                      : "bg-warn-soft text-warn",
                                  )}
                                >
                                  {p.pay.text}
                                </span>
                              ))}
                          </div>
                        </Card>
                      </m.div>
                    </div>
                  </div>

                  {/* ---------------- Back ---------------- */}
                  <div
                    className={cn(
                      "col-start-1 row-start-1 [backface-visibility:hidden] [transform:rotateY(180deg)]",
                      !flipped && "pointer-events-none",
                    )}
                    aria-hidden={!flipped}
                    inert={!flipped}
                  >
                    <Card>
                      <div className="relative h-14 overflow-hidden">
                        <EventArt
                          accent={p.accent}
                          seed={p.seed}
                          flat
                          scrim={false}
                        />
                        <Slot />
                      </div>
                      <div className="flex flex-col px-6 pb-6 pt-5">
                        <h3 className="font-display text-[24px] leading-tight text-ink">
                          At the gate
                        </h3>
                        <ol className="mt-4 space-y-3 text-[14px] text-ink-2">
                          {[
                            "Open your pass. It works offline.",
                            "Green on the scanner means you're in.",
                            "Each pass gets you in once.",
                          ].map((t, i) => (
                            <li key={i} className="flex gap-3">
                              <span
                                className="grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
                                style={{ background: p.ink }}
                              >
                                {i + 1}
                              </span>
                              <span className="pt-0.5">{t}</span>
                            </li>
                          ))}
                        </ol>
                        <dl className="mt-6 space-y-2 border-t border-dashed border-line-strong pt-4 font-mono text-[12.5px]">
                          {[
                            [
                              "When",
                              `${p.weekday} ${p.day} ${p.month}, ${p.timeRange}`,
                            ],
                            ["Where", p.venue],
                            ["Pass", p.passCode],
                            ["Serial", p.serial],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4">
                              <dt className="text-ink-subtle">{k}</dt>
                              <dd className="truncate text-right text-ink">
                                {v}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <Link
                          href={`/events/${p.slug}`}
                          className="mt-6 text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                        >
                          Event page and updates
                        </Link>
                      </div>
                    </Card>
                  </div>
                </m.div>
              </m.div>
            </div>
          </m.div>
        </m.div>
      </div>

      <div className="mt-8 flex w-full max-w-[340px] items-center gap-2">
        {canEnter && (
          <button
            type="button"
            onClick={() => setGate(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[15px] font-semibold text-white transition-colors duration-fast hover:bg-ink-2"
          >
            <Maximize2 className="size-4" aria-hidden /> Show at the gate
          </button>
        )}
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 text-[15px] font-semibold text-ink transition-colors duration-fast hover:border-ink",
            !canEnter && "flex-1",
          )}
        >
          <RotateCw className="size-4" aria-hidden />{" "}
          {flipped ? "Front" : "Flip"}
        </button>
        <button
          type="button"
          onClick={async () => {
            setSharing(true);
            await shareStory(p, artRef.current).catch(() => undefined);
            setSharing(false);
          }}
          disabled={sharing}
          aria-label="Share to your story"
          title="Share to your story (QR hidden)"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-white text-ink transition-colors duration-fast hover:border-ink disabled:opacity-60"
        >
          <Share2 className="size-4" aria-hidden />
        </button>
      </div>

      {gate && p.qrArt && (
        <GateView {...p} qrArt={p.qrArt} onClose={() => setGate(false)} />
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */

function Card({
  children,
  part = "whole",
}: {
  children: React.ReactNode;
  part?: "whole" | "top" | "bottom";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-[#DCD6C6] bg-[#FFFDF6]",
        part === "whole" &&
          "h-full rounded-[24px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        part === "top" &&
          "rounded-t-[24px] border border-b-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        part === "bottom" && "rounded-b-[24px] border border-t-0",
      )}
    >
      {children}
    </div>
  );
}

/** Woven strap, metal clip and ring, all drawn in CSS. */
function Lanyard({ tone }: { tone: string }) {
  return (
    <div
      aria-hidden
      className="relative mx-auto flex w-[46px] flex-col items-center"
    >
      <div
        className="relative h-[84px] w-[40px] overflow-hidden rounded-b-sm shadow-[inset_-3px_0_6px_rgba(0,0,0,0.18),inset_3px_0_6px_rgba(255,255,255,0.12)]"
        style={{
          background: `repeating-linear-gradient(0deg, ${tone} 0 2px, color-mix(in srgb, ${tone} 86%, black) 2px 4px)`,
        }}
      >
        <span className="absolute inset-x-0 top-1 flex flex-col items-center gap-3 font-display text-[11px] leading-none text-white/60 [writing-mode:vertical-rl]">
          <span>evntcult</span>
          <span>evntcult</span>
        </span>
      </div>
      <div className="relative -mt-1 h-[16px] w-[30px] rounded-[5px] bg-[linear-gradient(180deg,#F4F4F2,#B9B9B4_55%,#8E8E89)] shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.8)]">
        <span className="absolute inset-x-[7px] top-[5px] h-[3px] rounded-full bg-black/25" />
      </div>
      <div className="relative z-10 -mt-[3px] h-[30px] w-[16px] rounded-full border-[3px] border-[#A8A8A3] shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]" />
    </div>
  );
}

/** The punched slot the lanyard ring goes through: you see the page behind it. */
function Slot() {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-3 h-[11px] w-[54px] -translate-x-1/2 rounded-full bg-canvas shadow-[inset_0_2px_3px_rgba(0,0,0,0.35)]"
    />
  );
}

function Info({
  k,
  v,
  truncate,
}: {
  k: string;
  v: string;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-ink-muted">{k}</dt>
      <dd
        className={cn(
          "mt-0.5 text-[14px] font-semibold tabular-nums text-ink",
          truncate && "truncate",
        )}
      >
        {v}
      </dd>
    </div>
  );
}

/**
 * The perforation, drawn on both halves: notches bitten out of each edge, a dashed line while
 * the pass is whole, and torn paper teeth once the stub has come away.
 */
function Notches({ edge, torn }: { edge: "top" | "bottom"; torn: boolean }) {
  const y = edge === "bottom" ? "bottom-0 translate-y-1/2" : "top-0 -translate-y-1/2";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 z-10 h-0", edge === "bottom" ? "bottom-0" : "top-0")}>
      <span className={cn("absolute -left-3 size-6 rounded-full border border-[#DCD6C6] bg-canvas", y)} />
      <span className={cn("absolute -right-3 size-6 rounded-full border border-[#DCD6C6] bg-canvas", y)} />
      {edge === "top" && !torn && <span className="absolute inset-x-5 top-0 border-t-[1.5px] border-dashed border-[#D8D2C2]" />}
      {torn && (
        <svg
          viewBox="0 0 120 4"
          preserveAspectRatio="none"
          className={cn("absolute inset-x-3 h-[7px] w-[calc(100%-24px)]", edge === "bottom" ? "bottom-0" : "top-0 rotate-180")}
        >
          {/* Cut away past the torn line, and outline the teeth like the card's edge */}
          <path d={TEAR} className="fill-canvas" />
          <path d={TEAR_LINE} fill="none" stroke="#CFC9B8" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}

// Torn paper: uneven teeth along the perforation, as a filled shape and as its outline.
const TEETH_PTS = (() => {
  const pts: string[] = [];
  for (let x = 0; x < 120; x += 3) pts.push(`${x} ${x % 6 ? 3.4 : 1.6 + ((x * 7) % 5) * 0.4}`, `${x + 1.5} 0`);
  pts.push("120 3");
  return pts;
})();
const TEAR = `M0 4 L${TEETH_PTS.join(" L")} L120 4 Z`;
const TEAR_LINE = `M${TEETH_PTS.join(" L")}`;

/** Scanner-style corner brackets around the QR. */
function Brackets({ color }: { color: string }) {
  const c = "absolute size-5 border-[2.5px]";
  return (
    <span aria-hidden className="pointer-events-none absolute -inset-1.5">
      <span
        className={cn(
          c,
          "left-0 top-0 rounded-tl-[12px] border-b-0 border-r-0",
        )}
        style={{ borderColor: color }}
      />
      <span
        className={cn(
          c,
          "right-0 top-0 rounded-tr-[12px] border-b-0 border-l-0",
        )}
        style={{ borderColor: color }}
      />
      <span
        className={cn(
          c,
          "bottom-0 left-0 rounded-bl-[12px] border-r-0 border-t-0",
        )}
        style={{ borderColor: color }}
      />
      <span
        className={cn(
          c,
          "bottom-0 right-0 rounded-br-[12px] border-l-0 border-t-0",
        )}
        style={{ borderColor: color }}
      />
    </span>
  );
}

function Stamp({
  color,
  time,
  animate,
}: {
  color: string;
  time: string;
  animate: boolean;
}) {
  return (
    <m.div
      role="img"
      aria-label={`Admitted at ${time}`}
      className="pointer-events-none absolute right-4 top-3 rounded-lg border-[3px] bg-[#FFFDF6]/70 px-2.5 py-1 text-center"
      style={{ borderColor: color, color }}
      initial={
        animate ? { scale: 1.7, opacity: 0, rotate: -10 } : { rotate: -10 }
      }
      whileInView={{ scale: 1, opacity: 0.92, rotate: -10 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 520, damping: 16, delay: 0.55 }}
    >
      <span className="block font-display text-[20px] leading-none">
        Admitted
      </span>
      <span className="mt-0.5 block font-mono text-[10.5px] tracking-[0.1em]">
        {time}
      </span>
    </m.div>
  );
}

function GateView(p: HoloPassProps & { qrArt: string; onClose: () => void }) {
  useWakeLock();
  return (
    <ModalDialog label={`Pass for ${p.title}`} onClose={p.onClose}>
      <div className="absolute inset-0 flex flex-col items-center overflow-y-auto bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center">
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={p.onClose}
            aria-label="Close"
            className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-sunken"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="my-auto flex w-full max-w-sm flex-col items-center py-6">
          <p className="font-display text-[30px] leading-tight text-ink">
            {p.title}
          </p>
          <p className="mt-1 text-[15px] text-ink-muted">
            {p.weekday} {p.day} {p.month}, {p.time}
          </p>
          <div className="relative mt-8 rounded-[28px] bg-white p-4">
            <Brackets color={p.ink} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={svgSrc(p.qrArt)}
              alt={`QR code for pass ${p.passCode}`}
              className="block aspect-square w-[min(74vw,330px)]"
            />
          </div>
          <LiveProof accent={accentHex(p.accent)} />
          <p className="mt-5 text-[18px] font-semibold text-ink">{p.holder}</p>
          <p className="mt-1 text-[15px] text-ink-2">
            <span className="font-display text-[22px] text-ink">{passName(p.passCode).name}</span>
            <span className="ml-2 tabular-nums">No. {passName(p.passCode).no}</span>
          </p>
          {!!p.logistics?.length && (
            <div className="mt-4 w-full">
              <LogisticsPills items={p.logistics} ink={p.ink} />
            </div>
          )}
          {p.admittedAt ? (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-live">
              <CheckCircle2 className="size-4" aria-hidden /> Checked in at{" "}
              {p.admittedAt}
            </p>
          ) : (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted">
              <Sun className="size-4" aria-hidden /> Turn your screen brightness
              up for a faster scan
            </p>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}

/** High-contrast labels a volunteer can read at arm's length: FOOD Veg, SIZE L, TEAM Byte Club. */
function LogisticsPills({
  items,
  ink,
}: {
  items: { label: string; value: string }[];
  ink: string;
}) {
  return (
    <ul
      className="flex flex-wrap justify-center gap-1.5"
      aria-label="Your choices"
    >
      {items.map((it) => (
        <li
          key={it.label}
          className="inline-flex items-center overflow-hidden rounded-lg border text-[13px] font-semibold"
          style={{ borderColor: ink }}
        >
          <span className="px-2 py-1 text-white" style={{ background: ink }}>
            {shortLabel(it.label)}
          </span>
          <span className="max-w-[140px] truncate bg-white px-2 py-1 text-ink">
            {it.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Keep the screen on while the QR is up, so the phone doesn't lock in the queue. */
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    let alive = true;
    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (t: "screen") => Promise<{ release: () => Promise<void> }>;
      };
    };
    const get = async () => {
      if (!nav.wakeLock || document.visibilityState !== "visible") return;
      try {
        lock = await nav.wakeLock.request("screen");
        if (!alive) void lock.release();
      } catch {
        // Not allowed (battery saver, old browser). The pass still works.
      }
    };
    void get();
    const onVis = () => document.visibilityState === "visible" && void get();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

/**
 * A 1080x1920 story image of the pass, drawn on a canvas in the browser. The real QR is never
 * drawn: a decorative pattern stands in, so a screenshot of the story can't get anyone in.
 */
async function shareStory(p: HoloPassProps, artEl: HTMLDivElement | null) {
  const W = 1080;
  const H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return;
  await document.fonts?.ready;
  const display = getComputedStyle(
    document.querySelector(".font-display") ?? document.body,
  ).fontFamily;
  const sans = getComputedStyle(document.body).fontFamily;
  const tone = accentHex(p.accent);

  // Background: the event colour, with a soft vignette.
  g.fillStyle = tone;
  g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(
    W / 2,
    H * 0.35,
    100,
    W / 2,
    H * 0.5,
    H * 0.8,
  );
  vg.addColorStop(0, "rgba(255,255,255,0.10)");
  vg.addColorStop(1, "rgba(0,0,0,0.28)");
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  // Card
  const cx = 110;
  const cy = 250;
  const cw = W - 220;
  const ch = 1360;
  g.save();
  g.shadowColor = "rgba(0,0,0,0.35)";
  g.shadowBlur = 60;
  g.shadowOffsetY = 30;
  round(g, cx, cy, cw, ch, 48);
  g.fillStyle = "#FFFDF6";
  g.fill();
  g.restore();

  // Artwork, taken from the pass on screen
  const artH = 560;
  g.save();
  round(g, cx, cy, cw, ch, 48);
  g.clip();
  // The art's background colour lives on its wrapper, not in the SVG: paint it first.
  g.fillStyle = artEl
    ? getComputedStyle(artEl.firstElementChild ?? artEl).backgroundColor || tone
    : tone;
  if (g.fillStyle === "rgba(0, 0, 0, 0)" || g.fillStyle === "#000000")
    g.fillStyle = tone;
  g.fillRect(cx, cy, cw, artH);
  const svg = artEl?.querySelector("svg");
  if (svg) {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(cw));
    clone.setAttribute("height", String(artH));
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    await img.decode().catch(() => undefined);
    if (img.complete && img.naturalWidth) g.drawImage(img, cx, cy, cw, artH);
  } else {
    g.fillStyle = tone;
    g.fillRect(cx, cy, cw, artH);
  }
  const sh = g.createLinearGradient(0, cy + artH * 0.35, 0, cy + artH);
  sh.addColorStop(0, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(0,0,0,0.55)");
  g.fillStyle = sh;
  g.fillRect(cx, cy, cw, artH);
  g.restore();

  // Title over the art
  g.fillStyle = "#fff";
  g.font = `92px ${display}`;
  wrap(g, p.title, cx + 56, cy + artH - 60, cw - 112, 96, 2, true);

  // Holder and details
  g.fillStyle = "#6B6656";
  g.font = `500 34px ${sans}`;
  g.fillText("Attendee", cx + 56, cy + artH + 90);
  g.fillStyle = "#1A1A1A";
  g.font = `76px ${display}`;
  wrap(g, p.holder, cx + 56, cy + artH + 180, cw - 112, 80, 1);
  g.font = `600 38px ${sans}`;
  g.fillText(
    `${p.weekday} ${p.day} ${p.month}, ${p.time}`,
    cx + 56,
    cy + artH + 260,
  );
  g.fillStyle = "#6B6656";
  g.font = `400 36px ${sans}`;
  wrap(g, p.venue, cx + 56, cy + artH + 312, cw - 112, 40, 1);

  // Perforation
  const py = cy + artH + 380;
  g.strokeStyle = "#D8D2C2";
  g.setLineDash([14, 12]);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx + 40, py);
  g.lineTo(cx + cw - 40, py);
  g.stroke();
  g.setLineDash([]);
  for (const x of [cx, cx + cw]) {
    g.beginPath();
    g.arc(x, py, 26, 0, Math.PI * 2);
    g.fillStyle = tone;
    g.fill();
  }

  // Stand-in QR: decorative, deliberately not a code
  const qs = 260;
  const qx = cx + 56;
  const qy = py + 50;
  g.fillStyle = "#fff";
  round(g, qx - 16, qy - 16, qs + 32, qs + 32, 28);
  g.fill();
  let seed =
    [...p.passCode].reduce((a, ch2) => a * 31 + ch2.charCodeAt(0), 7) >>> 0;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const n = 13;
  const m = qs / n;
  g.fillStyle = "#E3DED0";
  for (let r = 0; r < n; r++)
    for (let k = 0; k < n; k++)
      if (rnd() > 0.5) {
        round(g, qx + k * m + 2, qy + r * m + 2, m - 4, m - 4, 5);
        g.fill();
      }
  g.fillStyle = "rgba(255,253,246,0.9)";
  round(g, qx + qs / 2 - 92, qy + qs / 2 - 28, 184, 56, 14);
  g.fill();
  g.fillStyle = "#6B6656";
  g.font = `600 26px ${sans}`;
  g.textAlign = "center";
  g.fillText("QR hidden", qx + qs / 2, qy + qs / 2 + 9);
  g.textAlign = "left";

  // Ticket number
  const num = `No. ${passName(p.passCode).no || p.passCode}`;
  g.fillStyle = "#1A1A1A";
  g.font = `110px ${display}`;
  g.fillText(num, qx + qs + 60, qy + 120);
  g.fillStyle = "#6B6656";
  g.font = `500 32px ${sans}`;
  g.fillText("Pass number", qx + qs + 64, qy + 170);

  // Branding
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.font = `64px ${display}`;
  g.textAlign = "center";
  g.fillText("evntcult", W / 2, H - 150);
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.font = `500 32px ${sans}`;
  g.fillText("Every event, one pass.", W / 2, H - 98);
  g.textAlign = "left";

  const blob = await new Promise<Blob | null>((res) =>
    c.toBlob(res, "image/png"),
  );
  if (!blob) return;
  const file = new File(
    [blob],
    `${p.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-story.png`,
    { type: "image/png" },
  );
  if (navigator.canShare?.({ files: [file] })) {
    await navigator
      .share({ files: [file], title: p.title })
      .catch(() => undefined);
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
}

function round(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** Draws text wrapped to maxLines; bottomUp anchors the last line at y (for titles over art). */
function wrap(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  lh: number,
  maxLines: number,
  bottomUp = false,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > max && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  const out = lines.slice(0, maxLines);
  if (lines.length > maxLines)
    out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S+$/, "") + "…";
  const start = bottomUp ? y - (out.length - 1) * lh : y;
  out.forEach((l, i) => g.fillText(l, x, start + i * lh));
}

/**
 * DICE-style proof the pass is live and not a screenshot: a band that keeps sweeping and a clock
 * that ticks every second. Door staff learn to look for movement.
 */
function LiveProof({ accent }: { accent: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-4 w-[min(74vw,330px)]" aria-label="Live pass">
      <div className="relative h-2 overflow-hidden rounded-full" style={{ background: `${accent}26` }}>
        <span className="live-sweep absolute inset-y-0 w-1/3 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      </div>
      <p className="mt-2 flex items-center justify-center gap-2 text-[12.5px] font-semibold text-ink-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full opacity-60" style={{ background: accent }} />
          <span className="relative inline-flex size-2 rounded-full" style={{ background: accent }} />
        </span>
        Live pass
        <span className="font-mono tabular-nums text-ink-muted" suppressHydrationWarning>
          {now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--"}
        </span>
      </p>
    </div>
  );
}
