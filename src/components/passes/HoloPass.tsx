"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { CheckCircle2, Hourglass, Maximize2, RotateCw, Sun, X } from "lucide-react";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { svgSrc } from "@/lib/svg-src";
import { cn } from "@/lib/utils";

export interface HoloPassProps {
  regId: string;
  slug: string;
  title: string;
  kind: string;
  weekday: string;
  day: string;
  month: string;
  timeRange: string;
  venue: string;
  holder: string;
  passCode: string;
  serial: string;
  qrSvg: string | null;
  accent: string;
  seed: string;
  state: "confirmed" | "live" | "waitlist" | "cancelled";
  waitlistNote?: string | null;
  pay?: { text: string; tone: "ok" | "warn"; href?: string } | null;
  admittedAt?: string | null;
}

/**
 * The pass as a piece of card stock: tilt it and the foil catches the light, flip it for the
 * back, and once you're scanned in an ADMITTED stamp lands on the stub. The QR itself never
 * tilts when it matters: "Show at the gate" opens it flat, full screen, at full size.
 */
export function HoloPass(p: HoloPassProps) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [gate, setGate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ink = accentHex(p.accent);

  // Pointer → tilt (springy), and the light position for the foil.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.35);
  const sx = useSpring(px, { stiffness: 170, damping: 22, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 170, damping: 22, mass: 0.6 });
  const rotY = useTransform(sx, [0, 1], [-11, 11]);
  const rotX = useTransform(sy, [0, 1], [9, -9]);
  const lx = useTransform(sx, (v) => `${v * 100}%`);
  const ly = useTransform(sy, (v) => `${v * 100}%`);
  const hue = useTransform(sx, [0, 1], [0, 140]);
  const shadowX = useTransform(sx, [0, 1], [18, -18]);
  const glare = useMotionTemplate`radial-gradient(circle at ${lx} ${ly}, rgba(255,255,255,0.55), rgba(255,255,255,0) 42%)`;
  const foil = useMotionTemplate`conic-gradient(from ${hue}deg at ${lx} ${ly}, #ff8fb1, #ffd166, #7ef0c0, #6ea8ff, #c9a2ff, #ff8fb1)`;

  function move(e: React.PointerEvent) {
    if (reduce || e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function leave() {
    px.set(0.5);
    py.set(0.35);
  }

  const canEnter = p.state === "confirmed" || p.state === "live";

  return (
    <article aria-label={`Pass for ${p.title}`} className="flex flex-col items-center">
      <div className="relative w-full max-w-[360px] [perspective:1400px]" ref={ref} onPointerMove={move} onPointerLeave={leave} onDoubleClick={() => setFlipped((f) => !f)}>
        {/* Contact shadow that follows the tilt */}
        <m.div
          aria-hidden
          className="absolute inset-x-8 -bottom-5 h-10 rounded-[50%] bg-[rgba(60,40,10,0.28)] blur-xl"
          style={reduce ? undefined : { x: shadowX }}
        />
        <m.div style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }} className="relative [transform-style:preserve-3d]">
          <m.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18 }}
            className="relative grid [transform-style:preserve-3d]"
          >
            {/* ---------- Front ---------- */}
            <div className={cn("col-start-1 row-start-1 [backface-visibility:hidden]", flipped && "pointer-events-none")} aria-hidden={flipped} inert={flipped}>
              <Paper ink={ink}>
                {/* Window over the event's art, with foil that shifts as you tilt */}
                <div className="relative m-3 mb-0 aspect-[16/10] overflow-hidden rounded-[18px]">
                  <EventArt accent={p.accent} seed={p.seed} scrim={false} />
                  {!reduce && (
                    <>
                      <m.div aria-hidden className="absolute inset-0 opacity-[0.2] mix-blend-color-dodge" style={{ background: foil }} />
                      <m.div aria-hidden className="absolute inset-0 mix-blend-soft-light" style={{ background: glare }} />
                    </>
                  )}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-ink shadow-[0_1px_2px_rgba(20,22,27,0.12)]">{p.kind}</span>
                    {p.state === "live" && <span className="rounded-md bg-accent px-2 py-1 text-[12px] font-semibold text-white">Happening now</span>}
                    {p.state === "waitlist" && <span className="rounded-md bg-warn-soft px-2 py-1 text-[12px] font-semibold text-warn">Waitlist</span>}
                    {p.state === "cancelled" && <span className="rounded-md bg-danger-soft px-2 py-1 text-[12px] font-semibold text-danger">Cancelled</span>}
                  </div>
                </div>

                <div className="relative px-5 pb-5 pt-4">
                  <h2 className="font-display text-[30px] leading-[1.02] tracking-[-0.02em] text-ink">{p.title}</h2>
                  <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1">
                    <div className="row-span-2 flex flex-col items-center rounded-xl border px-3 py-1.5 leading-none" style={{ borderColor: `${ink}40` }}>
                      <span className="text-[11px] font-semibold" style={{ color: ink }}>
                        {p.month}
                      </span>
                      <span className="mt-0.5 font-display text-[28px] tabular-nums text-ink">{p.day}</span>
                    </div>
                    <p className="text-[14.5px] font-semibold text-ink">
                      {p.weekday}, {p.timeRange}
                    </p>
                    <p className="truncate text-[14px] text-ink-muted">{p.venue}</p>
                  </div>
                </div>

                <Perforation ink={ink} />

                {/* Stub */}
                <div className="relative flex items-center gap-4 px-5 pb-5 pt-4">
                  {canEnter && p.qrSvg ? (
                    <button
                      type="button"
                      onClick={() => setGate(true)}
                      className="group relative shrink-0 rounded-xl bg-white p-2 ring-1 ring-line transition-shadow duration-fast hover:shadow-raised"
                      aria-label="Show the QR code full screen for the gate"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={svgSrc(p.qrSvg)} alt={`QR code for pass ${p.passCode}`} className="block size-[108px]" />
                      <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink text-white opacity-0 transition-opacity duration-fast group-hover:opacity-100" aria-hidden>
                        <Maximize2 className="size-3" />
                      </span>
                    </button>
                  ) : (
                    <div className="grid size-[124px] shrink-0 place-items-center rounded-xl border border-dashed border-line-strong bg-sunken/50 p-3 text-center text-[12px] text-ink-muted">
                      <span>
                        <Hourglass className="mx-auto mb-1 size-4" aria-hidden />
                        {p.state === "cancelled" ? "No entry" : "QR once you get a seat"}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="text-[12px] font-medium text-ink-muted">Admit one</p>
                    <p className="truncate text-[15px] font-semibold text-ink">{p.holder}</p>
                    <p className="font-mono text-[13px] tracking-[0.1em] text-ink">{p.passCode}</p>
                    <p className="font-mono text-[11px] tracking-[0.08em] text-ink-subtle">No. {p.serial}</p>
                    {p.pay &&
                      (p.pay.href ? (
                        <Link href={p.pay.href} className={cn("inline-block text-[13px] font-semibold underline underline-offset-2", p.pay.tone === "ok" ? "text-live" : "text-warn")}>
                          {p.pay.text}
                        </Link>
                      ) : (
                        <p className={cn("text-[13px] font-semibold", p.pay.tone === "ok" ? "text-live" : "text-warn")}>{p.pay.text}</p>
                      ))}
                    {p.waitlistNote && <p className="text-[12.5px] text-ink-2">{p.waitlistNote}</p>}
                  </div>
                  {p.admittedAt && <Stamp ink={ink} time={p.admittedAt} animate={!reduce} />}
                </div>
              </Paper>
            </div>

            {/* ---------- Back ---------- */}
            <div
              className={cn("col-start-1 row-start-1 [backface-visibility:hidden] [transform:rotateY(180deg)]", !flipped && "pointer-events-none")}
              aria-hidden={!flipped}
              inert={!flipped}
            >
              <Paper ink={ink} back>
                <div className="flex h-full flex-col px-6 pb-6 pt-7">
                  <p className="font-mono text-[11px] tracking-[0.12em] text-ink-subtle">No. {p.serial}</p>
                  <h3 className="mt-2 font-display text-[26px] leading-tight text-ink">How entry works</h3>
                  <ol className="mt-4 space-y-3 text-[14px] text-ink-2">
                    {[
                      "Open this pass at the gate. It works without internet.",
                      "A volunteer scans the QR. Green means you're in.",
                      "One scan admits one person. A second scan shows “Already in”.",
                    ].map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: ink }}>
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{t}</span>
                      </li>
                    ))}
                  </ol>
                  <dl className="mt-6 space-y-2 border-t border-dashed border-line-strong pt-4 font-mono text-[12.5px]">
                    {[
                      ["Event", p.title],
                      ["When", `${p.weekday} ${p.day} ${p.month}, ${p.timeRange}`],
                      ["Where", p.venue],
                      ["Holder", p.holder],
                      ["Pass", p.passCode],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-ink-subtle">{k}</dt>
                        <dd className="truncate text-right text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-auto pt-6">
                    <Link href={`/events/${p.slug}`} className="text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                      Event page and updates
                    </Link>
                  </div>
                </div>
              </Paper>
            </div>
          </m.div>
        </m.div>
      </div>

      {/* Controls under the card */}
      <div className="mt-6 flex w-full max-w-[360px] items-center gap-2">
        {canEnter && p.qrSvg && (
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-4 text-[15px] font-semibold text-ink transition-colors duration-fast hover:border-ink"
        >
          <RotateCw className="size-4" aria-hidden /> {flipped ? "Front" : "Flip"}
        </button>
      </div>

      {gate && p.qrSvg && <GateView {...p} qrSvg={p.qrSvg} ink={ink} onClose={() => setGate(false)} />}
    </article>
  );
}

/* ------------------------------------------------------------------ */

/** Card stock: warm paper, a hairline edge, notches at the perforation, and a guilloche rosette. */
function Paper({ ink, children }: { ink: string; back?: boolean; children: React.ReactNode }) {
  const rosette = useMemo(() => guilloche(), []);
  return (
    <div
      className="relative h-full overflow-hidden rounded-[26px] border border-[#DCD6C6] bg-[#FFFDF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
    >
      <svg aria-hidden viewBox="-100 -100 200 200" className="pointer-events-none absolute -right-24 bottom-6 size-[300px] opacity-[0.14]">
        <path d={rosette} fill="none" stroke={ink} strokeWidth="0.35" />
      </svg>
      {children}
    </div>
  );
}

/** The tear line between the pass and its stub: dashes and a row of punched holes. */
function Perforation({ ink }: { ink: string }) {
  return (
    <div aria-hidden className="relative mx-5 flex h-0 items-center justify-between">
      <span className="absolute inset-x-0 top-0 border-t-[1.5px] border-dashed" style={{ borderColor: `${ink}55` }} />
      {/* Side notches: bites out of the card edge, half hidden by the card's own clip */}
      <span className="absolute -left-[33px] -top-3 size-6 rounded-full border border-[#DCD6C6] bg-canvas" />
      <span className="absolute -right-[33px] -top-3 size-6 rounded-full border border-[#DCD6C6] bg-canvas" />
      {Array.from({ length: 18 }, (_, i) => (
        <span key={i} className="relative -top-[3px] size-[6px] rounded-full bg-[#EDE8DA] shadow-[inset_0_1px_1px_rgba(60,40,10,0.25)]" />
      ))}
    </div>
  );
}

function Stamp({ ink, time, animate }: { ink: string; time: string; animate: boolean }) {
  return (
    <m.div
      aria-label={`Admitted at ${time}`}
      role="img"
      className="pointer-events-none absolute right-4 top-2 rotate-[-12deg] rounded-lg border-[3px] px-3 py-1.5 text-center mix-blend-multiply"
      style={{ borderColor: ink, color: ink }}
      initial={animate ? { scale: 1.6, opacity: 0 } : false}
      whileInView={{ scale: 1, opacity: 0.9 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
    >
      <span className="block font-display text-[22px] leading-none">Admitted</span>
      <span className="mt-0.5 block font-mono text-[11px] tracking-[0.1em]">{time}</span>
    </m.div>
  );
}

/** Full-screen, flat, bright: what the volunteer actually scans. */
function GateView(p: HoloPassProps & { qrSvg: string; ink: string; onClose: () => void }) {
  return (
    <ModalDialog label={`Pass for ${p.title}`} onClose={p.onClose}>
      <div className="absolute inset-0 flex flex-col items-center overflow-y-auto bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-center">
        <div className="flex w-full justify-end">
          <button type="button" onClick={p.onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-sunken">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="my-auto flex w-full max-w-sm flex-col items-center py-6">
          <span className="h-1.5 w-16 rounded-full" style={{ background: p.ink }} aria-hidden />
          <p className="mt-5 font-display text-[30px] leading-tight text-ink">{p.title}</p>
          <p className="mt-1 text-[15px] text-ink-muted">
            {p.weekday} {p.day} {p.month}, {p.timeRange}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgSrc(p.qrSvg)} alt={`QR code for pass ${p.passCode}`} className="mt-8 aspect-square w-[min(78vw,340px)]" />
          <p className="mt-5 font-mono text-[18px] tracking-[0.16em] text-ink">{p.passCode}</p>
          <p className="mt-1 text-[16px] font-semibold text-ink">{p.holder}</p>
          {p.admittedAt ? (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-live">
              <CheckCircle2 className="size-4" aria-hidden /> Checked in at {p.admittedAt}
            </p>
          ) : (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted">
              <Sun className="size-4" aria-hidden /> Turn your screen brightness up for a faster scan
            </p>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}

/** A guilloche rosette (the fine engraved pattern on banknotes), drawn from sine waves. */
function guilloche(): string {
  const parts: string[] = [];
  for (let ring = 0; ring < 5; ring++) {
    const R = 46 + ring * 9;
    const a = 7 + ring * 1.5;
    const k = 12 + ring * 2;
    let d = "";
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      const r = R + a * Math.sin(k * t) + 3 * Math.sin(3 * k * t + ring);
      d += `${i ? "L" : "M"}${(r * Math.cos(t)).toFixed(1)} ${(r * Math.sin(t)).toFixed(1)}`;
    }
    parts.push(d + "Z");
  }
  return parts.join("");
}
