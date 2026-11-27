"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { EventArt } from "@/components/ui/EventArt";
import { MiniPrinter } from "./MiniPrinter";
import { EASE } from "@/components/motion/MotionProvider";

const DECK = [
  {
    id: "hero-pass",
    title: "Sunset Sessions",
    accent: "violet" as const,
    date: "Fri 12 Dec",
    doors: "7:30 pm",
    venue: "Riverside Lawn",
    seat: "Admit one",
    holder: "Your name",
  },
  {
    id: "hack-pass",
    title: "HackNight '26",
    accent: "blue" as const,
    date: "Sat 13 Dec",
    doors: "6:00 pm",
    venue: "Main Auditorium",
    seat: "Team Byte Me",
    holder: "Builder pass",
  },
  {
    id: "garba-pass",
    title: "Garba Under Stars",
    accent: "pink" as const,
    date: "Sun 14 Dec",
    doors: "8:00 pm",
    venue: "Central Quad",
    seat: "Couple entry",
    holder: "VIP lawn",
  },
];

/**
 * The hero's right side: an interactive 3-pass physical card deck you can tilt (pointer or
 * keyboard arrows) and cycle through, alongside a working thermal ticket printer.
 * All sample data is explicitly labelled "Example pass".
 */
export function HeroShowcase({ qr }: { qr: string }) {
  const card = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
    mx: 50,
    my: 30,
    active: false,
  });

  const current = DECK[index];
  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % DECK.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + DECK.length) % DECK.length);
  };

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
    <div className="relative mx-auto w-full max-w-[540px] rounded-[28px] border border-line bg-sunken/55 p-4 sm:p-6">
      <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5">
      {/* Interactive 3-pass deck */}
      <div className="min-w-0">
        <div style={{ perspective: 1100 }} className="relative">
          {/* Two physical cardstock plates stacked behind */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={next}
            className="absolute inset-0 -z-10 translate-x-3 translate-y-2.5 rotate-[4deg] rounded-[24px] border border-line-strong bg-sunken shadow-card transition-transform duration-300 hover:translate-x-4 hover:rotate-[5.5deg]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 -translate-x-2 translate-y-1.5 -rotate-[3deg] rounded-[24px] border border-line-strong bg-surface/90"
          />

          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={current.id}
              initial={{ opacity: 0, y: 14, scale: 0.96, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: -12, scale: 0.96, rotate: 2 }}
              transition={{ duration: 0.34, ease: EASE }}
            >
              <div
                ref={card}
                tabIndex={0}
                role="img"
                aria-label={`Example EvntCult pass for ${current.title}. Hover or use arrow keys to tilt it.`}
                onPointerMove={onMove}
                onPointerLeave={rest}
                onKeyDown={onKey}
                onBlur={rest}
                className="paper-keep relative rounded-[24px] outline-none [transform-style:preserve-3d] focus-visible:shadow-[var(--focus-ring)]"
                style={{
                  transform: `rotateX(${flipped ? 0 : tilt.x}deg) rotateY(${flipped ? 180 : tilt.y}deg)`,
                  transition: tilt.active && !flipped
                    ? "transform 90ms linear"
                    : "transform 680ms var(--ease-spring)",
                }}
              >
                {/* Front face */}
                <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_36px_72px_-30px_rgba(60,40,10,0.42),0_0_0_1px_rgba(26,26,26,0.08)] [backface-visibility:hidden]">
                  {/* Warm sunlit paper sheen on pointer tilt */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                    style={{
                      opacity: tilt.active ? 0.5 : 0,
                      background: `radial-gradient(260px circle at ${tilt.mx}% ${tilt.my}%, rgba(255,254,246,0.42), transparent 65%)`,
                    }}
                  />
                  <div className="relative aspect-[16/10]">
                    <EventArt accent={current.accent} seed={current.id} scrim={false} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5 pt-12">
                      <p className="font-display text-[32px] leading-none tracking-[-0.02em] text-white">
                        {current.title}
                      </p>
                    </div>
                    <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-sm">
                        Example pass
                      </span>
                      <span className="rounded-lg bg-black/45 px-2 py-1 font-mono text-[10.5px] font-medium text-white backdrop-blur-sm">
                        NO. 00{index + 42}
                      </span>
                    </div>
                  </div>
                  {/* Perforated tear divider */}
                  <div className="relative flex items-center bg-white">
                    <span className="size-4 -translate-x-1/2 rounded-full bg-sunken ring-1 ring-line-strong" aria-hidden />
                    <div className="flex-1 border-t border-dashed border-line-strong" />
                    <span className="size-4 translate-x-1/2 rounded-full bg-sunken ring-1 ring-line-strong" aria-hidden />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-4 p-5 pt-3.5">
                    <div className="min-w-0">
                      <p className="text-[12px] text-ink-muted">{current.seat}</p>
                      <p className="mt-0.5 truncate font-display text-[28px] leading-none text-ink">
                        {current.holder}
                      </p>
                      <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                        <div>
                          <dt className="text-ink-muted">Date</dt>
                          <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
                            {current.date}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Doors</dt>
                          <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
                            {current.doors}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-ink-muted">Venue</dt>
                          <dd className="truncate font-semibold text-ink">
                            {current.venue}
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

                {/* Back face (Apple Wallet style reverse details) */}
                <div
                  aria-hidden={!flipped}
                  className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[24px] bg-white p-6 text-ink shadow-[0_36px_72px_-30px_rgba(60,40,10,0.42),0_0_0_1px_rgba(26,26,26,0.08)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <span className="text-[12px] font-semibold text-ink-muted">Pass details · Example</span>
                      <span className="rounded-full bg-live-soft px-2.5 py-0.5 text-[11px] font-semibold text-live">
                        Offline ready
                      </span>
                    </div>
                    <p className="mt-4 font-display text-[28px] leading-none text-ink">{current.title}</p>
                    <dl className="mt-4 space-y-2.5 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Entry desk</dt>
                        <dd className="font-semibold text-ink">Gate 1 · {current.venue}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Check-in</dt>
                        <dd className="font-semibold text-ink">QR scan, no printout needed</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Photos</dt>
                        <dd className="font-semibold text-ink">Auto-delivered to Photo Vault</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Transfer</dt>
                        <dd className="font-semibold text-ink">Cancel anytime from My Passes</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3 text-[12px] text-ink-muted">
                    <span className="font-semibold">Velvet Comet</span>
                    <button
                      type="button"
                      onClick={() => setFlipped(false)}
                      className="font-semibold text-ink underline underline-offset-4"
                    >
                      Back to front
                    </button>
                  </div>
                </div>
              </div>
            </m.div>
          </AnimatePresence>
        </div>

        {/* Tactile pass switcher + 3D flip controls */}
        <div className="mt-4 flex items-center justify-between gap-2 px-0.5 text-[12.5px] text-ink-muted">
          <span className="font-mono font-medium tabular-nums">
            0{index + 1} / 0{DECK.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="inline-flex min-h-[44px] items-center rounded-full border border-line-strong bg-surface px-3.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink sm:min-h-[34px]"
            >
              {flipped ? "Show front" : "Flip pass"}
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-[44px] items-center rounded-full border border-line-strong bg-surface px-3.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink sm:min-h-[34px]"
            >
              Next pass
            </button>
          </div>
        </div>
      </div>

      <MiniPrinter />
      </div>
    </div>
  );
}
