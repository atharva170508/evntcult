"use client";

import { useRef, useState } from "react";
import { EventArt } from "@/components/ui/EventArt";
import { MiniPrinter } from "./MiniPrinter";
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
          className="paper-keep relative overflow-hidden rounded-[24px] bg-white shadow-[0_40px_80px_-30px_rgba(60,40,10,0.45),0_0_0_1px_rgba(26,26,26,0.06)] outline-none [transform-style:preserve-3d] focus-visible:shadow-[var(--focus-ring)]"
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
            <span className="absolute left-4 top-4 rounded-lg bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink">
              Example pass
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4 p-5">
            <div className="min-w-0">
              <p className="text-[12px] text-ink-muted">Admit one</p>
              <p className="mt-0.5 font-display text-[26px] leading-none text-ink truncate">
                Your name
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                <div>
                  <dt className="text-ink-muted">Date</dt>
                  <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
                    Fri 12 Dec
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Doors</dt>
                  <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
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
        </div>
      </div>

      <MiniPrinter />
    </div>
  );
}
