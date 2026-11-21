"use client";

import { useRef, useState } from "react";
import { BrandLogo, BrandMark } from "@/components/site/Brand";
import { EventArt } from "@/components/ui/EventArt";
import { cn } from "@/lib/utils";

/**
 * The hero's right side: an example pass you can tilt (pointer or keyboard arrows), and a tiny
 * ticket printer that prints one when you press it. Example data; scanning the QR opens EvntCult.
 */
export function HeroShowcase({ qr }: { qr: string }) {
  const card = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
    mx: 50,
    my: 30,
    active: false,
  });
  const [prints, setPrints] = useState(0);
  const [printing, setPrinting] = useState(false);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = card.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({
      x: (0.5 - py) * 14,
      y: (px - 0.5) * 18,
      mx: px * 100,
      my: py * 100,
      active: true,
    });
  };
  const rest = () => setTilt({ x: 0, y: 0, mx: 50, my: 30, active: false });
  const onKey = (e: React.KeyboardEvent) => {
    const step = {
      ArrowUp: [4, 0],
      ArrowDown: [-4, 0],
      ArrowLeft: [0, -5],
      ArrowRight: [0, 5],
    }[e.key];
    if (!step) return;
    e.preventDefault();
    setTilt((t) => ({
      ...t,
      x: Math.max(-12, Math.min(12, t.x + step[0])),
      y: Math.max(-16, Math.min(16, t.y + step[1])),
      active: true,
    }));
  };
  const print = () => {
    if (printing) return;
    setPrinting(true);
    setPrints((n) => n + 1);
    try {
      navigator.vibrate?.([12, 40, 12]);
    } catch {}
    setTimeout(() => setPrinting(false), 1500);
  };

  return (
    <div className="relative mx-auto grid w-full max-w-[520px] grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:gap-6">
      {/* Soft lavender light behind the pass. */}
      <span
        aria-hidden
        className="absolute left-[8%] top-[6%] -z-10 size-[70%] rounded-full bg-lavender/70 blur-[70px]"
      />

      {/* The pass */}
      <div style={{ perspective: 1100 }} className="relative min-w-0">
        <div
          ref={card}
          tabIndex={0}
          role="img"
          aria-label="Example EvntCult pass for Freshers' Night. Hover or use the arrow keys to tilt it."
          onPointerMove={onMove}
          onPointerLeave={rest}
          onKeyDown={onKey}
          onBlur={rest}
          className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_40px_80px_-30px_rgba(60,40,10,0.45),0_0_0_1px_rgba(26,26,26,0.06)] outline-none [transform-style:preserve-3d] focus-visible:shadow-[var(--focus-ring)]"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: tilt.active
              ? "transform 90ms linear"
              : "transform 700ms var(--ease-spring)",
          }}
        >
          <div className="relative aspect-[16/10]">
            <EventArt accent="violet" seed="hero-pass" scrim={false} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 pt-12">
              <p className="font-display text-[30px] leading-none text-white">
                Freshers&apos; Night
              </p>
            </div>
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink">
              Example pass
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4 p-5">
            <div className="min-w-0">
              <p className="text-[12px] text-ink-muted">Admit one</p>
              <p className="mt-0.5 font-display text-[26px] leading-none text-ink">
                Your name
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                <div>
                  <dt className="text-ink-muted">Date</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    Fri 12 Dec
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Doors</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    7:30 pm
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink-muted">Venue</dt>
                  <dd className="truncate font-semibold text-ink">
                    Main Auditorium
                  </dd>
                </div>
              </dl>
            </div>
            <div
              className="size-[104px] shrink-0 overflow-hidden rounded-[12px] bg-white ring-1 ring-line [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          </div>
          {/* Foil: a light that follows the pointer across the card. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-300"
            style={{
              opacity: tilt.active ? 1 : 0,
              background: `radial-gradient(420px circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.75), rgba(240,215,255,0.35) 30%, transparent 60%)`,
            }}
          />
        </div>
      </div>

      {/* The mini printer */}
      <div className="flex w-[148px] flex-col items-center justify-self-center sm:w-[132px]">
        <div
          className="relative h-[120px] w-full overflow-hidden sm:h-[150px]"
          aria-hidden
        >
          {Array.from({ length: Math.min(prints, 3) }, (_, i) => {
            const n = prints - Math.min(prints, 3) + i;
            const latest = n === prints - 1;
            return (
              <div
                key={n}
                className={cn(
                  "absolute inset-x-0 bottom-0 mx-auto w-[106px] rounded-t-[6px] bg-white px-2.5 pb-3 pt-2.5 shadow-[0_6px_16px_-8px_rgba(60,40,10,0.35)] ring-1 ring-line",
                  latest ? "hero-print-feed" : "",
                )}
                style={
                  !latest
                    ? {
                        transform: `translateY(${(prints - 1 - n) * -6}px) rotate(${(n % 2 ? 1 : -1) * 2}deg)`,
                        opacity: 0.5,
                      }
                    : undefined
                }
              >
                <BrandMark className="size-3.5" />
                <p className="mt-1.5 text-[10px] font-semibold leading-tight text-ink">
                  Admit one
                </p>
                <p className="font-mono text-[8.5px] tabular-nums text-ink-muted">
                  EC-FRSH-{String(41 + n).padStart(4, "0")}
                </p>
                <div className="mt-2 grid grid-cols-5 gap-[2px]">
                  {Array.from({ length: 25 }, (_, k) => (
                    <span
                      key={k}
                      className={cn(
                        "aspect-square rounded-[1px]",
                        (k * 7 + n * 3) % 3 === 0 || [0, 4, 20].includes(k)
                          ? "bg-ink"
                          : "bg-transparent",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-2 h-px border-t border-dashed border-line-strong" />
              </div>
            );
          })}
        </div>
        <div className="relative w-full rounded-[18px] bg-ink p-3 pt-2 shadow-[0_20px_40px_-18px_rgba(26,26,26,0.7),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div
            className="mx-auto h-1.5 w-[84%] rounded-full bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]"
            aria-hidden
          />
          <div className="mt-2.5 flex items-center justify-between">
            <BrandLogo tone="white" className="text-[11px]" />
            <span
              className={cn(
                "size-1.5 rounded-full",
                printing ? "bg-[#5EE0A8] shadow-[0_0_8px_#5EE0A8]" : "bg-brand",
              )}
              aria-hidden
            />
          </div>
          <button
            type="button"
            onClick={print}
            disabled={printing}
            className="ui-press mt-2.5 h-9 w-full rounded-[10px] bg-lavender text-[13px] font-semibold text-ink shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] hover:bg-lavender-hover disabled:opacity-70"
          >
            {printing ? "Printing…" : prints ? "Print another" : "Print a pass"}
          </button>
        </div>
        <span className="sr-only" role="status">
          {prints
            ? `Printed ${prints} example ${prints === 1 ? "pass" : "passes"}.`
            : ""}
        </span>
      </div>
    </div>
  );
}
