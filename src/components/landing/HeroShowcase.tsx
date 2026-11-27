"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, RotateCw, ShieldCheck } from "lucide-react";
import { MiniPrinter } from "./MiniPrinter";
import { HeroPassArt, type HeroArtKind } from "./HeroPassArt";
import { EASE } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

const DECK: {
  id: string;
  art: HeroArtKind;
  edition: string;
  title: string;
  date: string;
  doors: string;
  venue: string;
  seat: string;
  holder: string;
  serial: string;
  gate: string;
}[] = [
  {
    id: "hero-pass",
    art: "sunset",
    edition: "Live music · Riverside",
    title: "Sunset Sessions",
    date: "Fri 12 Dec",
    doors: "7:30 pm",
    venue: "Riverside Lawn",
    seat: "Admit one",
    holder: "Your name",
    serial: "No. 0042",
    gate: "Gate 1",
  },
  {
    id: "hack-pass",
    art: "hacknight",
    edition: "36-hour hackathon",
    title: "HackNight '26",
    date: "Sat 13 Dec",
    doors: "6:00 pm",
    venue: "Main Auditorium",
    seat: "Team Byte Me",
    holder: "Builder pass",
    serial: "No. 0043",
    gate: "North Hall",
  },
  {
    id: "garba-pass",
    art: "garba",
    edition: "Cultural night",
    title: "Garba Under Stars",
    date: "Sun 14 Dec",
    doors: "8:00 pm",
    venue: "Central Quad",
    seat: "Couple entry",
    holder: "VIP lawn",
    serial: "No. 0044",
    gate: "East Arch",
  },
];

const BARCODE_WEIGHTS = [
  2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2,
];

/**
 * The hero's right side: an architectural object-studio stage holding an interactive
 * 3-pass cardstock deck (tilt via pointer or arrow keys, 3D flip, direct pass selector)
 * paired with a working Teenage-Engineering-inspired thermal ticket printer.
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
  const select = (nextIndex: number) => {
    setFlipped(false);
    setIndex(nextIndex);
  };
  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % DECK.length);
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = card.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({
      x: (0.5 - py) * 13,
      y: (px - 0.5) * 16,
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
    <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[30px] border border-line-strong/80 bg-sunken/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_28px_64px_-38px_rgba(40,30,10,0.28)] dark:bg-surface/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_28px_64px_-34px_rgba(0,0,0,0.75)] sm:p-6">
      {/* Subtle studio top spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_48%_0%,rgba(255,255,255,0.78)_0%,transparent_64%)] dark:bg-[radial-gradient(120%_85%_at_48%_0%,rgba(255,255,255,0.05)_0%,transparent_64%)]"
      />
      {/* Four architectural corner registration ticks */}
      <span aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 h-2.5 w-2.5 border-l border-t border-ink/20" />
      <span aria-hidden className="pointer-events-none absolute right-3.5 top-3.5 h-2.5 w-2.5 border-r border-t border-ink/20" />
      <span aria-hidden className="pointer-events-none absolute bottom-3.5 left-3.5 h-2.5 w-2.5 border-b border-l border-ink/20" />
      <span aria-hidden className="pointer-events-none absolute bottom-3.5 right-3.5 h-2.5 w-2.5 border-b border-r border-ink/20" />

      {/* Studio plate top header */}
      <div className="relative z-10 mb-5 flex items-center justify-between gap-3 border-b border-line-strong/70 pb-3">
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
          <span className="size-1.5 rounded-full bg-live" aria-hidden />
          <span>Interactive pass</span>
          <span className="text-line-strong" aria-hidden>·</span>
          <span className="text-ink-subtle">Tilt or flip</span>
        </div>
        <div className="flex items-center gap-1" role="tablist" aria-label="Choose example pass">
          {DECK.map((item, i) => {
            const active = i === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Show ${item.title} example pass`}
                onClick={() => select(i)}
                className={cn(
                  "inline-flex min-h-[44px] min-w-[40px] items-center justify-center rounded-full px-2.5 font-mono text-[11px] font-semibold tabular-nums transition-colors sm:min-h-[30px] sm:min-w-[34px]",
                  active
                    ? "bg-ink text-canvas shadow-sm"
                    : "text-ink-muted hover:bg-surface/80 hover:text-ink",
                )}
              >
                0{i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 items-end gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5">
        {/* Interactive 3-pass cardstock deck */}
        <div className="min-w-0">
          <div style={{ perspective: 1200 }} className="relative">
            {/* Layered physical cardstock plates behind */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={next}
              className="absolute inset-0 -z-10 translate-x-2.5 translate-y-2.5 rotate-[3.2deg] rounded-[24px] border border-line-strong bg-surface/95 shadow-card transition-transform duration-300 hover:translate-x-3.5 hover:rotate-[4.6deg]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-20 -translate-x-2 translate-y-2 -rotate-[2.4deg] rounded-[24px] border border-line-strong/80 bg-canvas/85"
            />

            <AnimatePresence mode="popLayout" initial={false}>
              <m.div
                key={current.id}
                initial={{ opacity: 0, y: 12, scale: 0.965, rotate: -1.6 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.965, rotate: 1.6 }}
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
                    transition:
                      tilt.active && !flipped
                        ? "transform 85ms linear"
                        : "transform 680ms var(--ease-spring)",
                  }}
                >
                  {/* Front face */}
                  <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_36px_68px_-28px_rgba(32,22,8,0.44),0_8px_20px_-10px_rgba(32,22,8,0.16),0_0_0_1px_rgba(26,26,26,0.09)] [backface-visibility:hidden]">
                    {/* Optical specular & subtle iridescent tilt sheen */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
                      style={{
                        opacity: tilt.active ? 0.6 : 0,
                        background: `radial-gradient(260px circle at ${tilt.mx}% ${tilt.my}%, rgba(255,254,246,0.48), rgba(240,215,255,0.16) 40%, transparent 70%)`,
                      }}
                    />

                    {/* Editorial poster header */}
                    <div className="relative aspect-[16/10]">
                      <HeroPassArt kind={current.art} />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-14">
                        <p className="text-[11.5px] font-medium text-white/80">
                          {current.edition}
                        </p>
                        <p className="mt-1 font-display text-[34px] leading-[0.95] tracking-[-0.02em] text-white">
                          {current.title}
                        </p>
                      </div>
                      <div className="absolute left-4 top-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
                          <ShieldCheck className="size-3 text-live" aria-hidden />
                          Example pass
                        </span>
                      </div>
                    </div>

                    {/* Optical metallic security strip + true perforated tear divider */}
                    <div
                      aria-hidden
                      className="h-[3px] w-full"
                      style={{
                        background: `linear-gradient(90deg, #E7DFCE 0%, #F0D7FF ${Math.max(18, Math.min(82, tilt.mx))}%, #FFE0A3 ${Math.max(30, Math.min(92, tilt.mx + 14))}%, #E7DFCE 100%)`,
                      }}
                    />
                    <div className="relative flex items-center bg-white py-1">
                      <span
                        className="size-3.5 -translate-x-1/2 rounded-full bg-[#ECE8DC] shadow-[inset_-1px_0_2px_rgba(26,26,26,0.16)] dark:bg-[#1E1C19]"
                        aria-hidden
                      />
                      <div className="mx-1 flex-1 border-t border-dashed border-line-strong" />
                      <span
                        className="size-3.5 translate-x-1/2 rounded-full bg-[#ECE8DC] shadow-[inset_1px_0_2px_rgba(26,26,26,0.16)] dark:bg-[#1E1C19]"
                        aria-hidden
                      />
                    </div>

                    {/* Cardstock ticket body */}
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 pb-4 pt-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-ink-muted">
                          {current.seat}
                        </p>
                        <p className="mt-0.5 truncate font-display text-[29px] leading-none text-ink">
                          {current.holder}
                        </p>
                        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                          <div>
                            <dt className="text-[11px] text-ink-muted">Date</dt>
                            <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
                              {current.date}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-ink-muted">Doors</dt>
                            <dd className="whitespace-nowrap font-semibold tabular-nums text-ink">
                              {current.doors}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[11px] text-ink-muted">Venue</dt>
                            <dd className="truncate font-semibold text-ink">
                              {current.venue}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Framed QR housing */}
                      <div className="relative shrink-0 rounded-[14px] bg-white p-2 shadow-[inset_0_0_0_1px_rgba(26,26,26,0.09)]">
                        <div
                          className="size-[102px] overflow-hidden rounded-[8px] bg-white [&>svg]:size-full"
                          dangerouslySetInnerHTML={{ __html: qr }}
                        />
                      </div>
                    </div>

                    {/* Subtle thermal bottom barcode footer */}
                    <div className="flex items-center justify-between border-t border-line bg-[#FAF8F2] px-5 py-2">
                      <div className="flex h-3 items-stretch gap-[1.5px] opacity-50" aria-hidden>
                        {BARCODE_WEIGHTS.map((w, idx) => (
                          <span
                            key={idx}
                            className="bg-ink"
                            style={{ width: `${w}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[10px] font-medium tabular-nums text-ink-muted">
                        {current.serial} · {current.gate}
                      </span>
                    </div>
                  </div>

                  {/* Back face (Apple Wallet style reverse details) */}
                  <div
                    aria-hidden={!flipped}
                    className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[24px] bg-white p-6 text-ink shadow-[0_36px_68px_-28px_rgba(32,22,8,0.44),0_0_0_1px_rgba(26,26,26,0.09)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <span className="text-[12px] font-semibold text-ink-muted">
                          Pass details · {current.serial}
                        </span>
                        <span className="rounded-full bg-live-soft px-2.5 py-0.5 text-[11px] font-semibold text-live">
                          Offline ready
                        </span>
                      </div>
                      <p className="mt-4 font-display text-[30px] leading-none text-ink">
                        {current.title}
                      </p>
                      <dl className="mt-4 space-y-2.5 text-[13px]">
                        <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
                          <dt className="text-ink-muted">Entry desk</dt>
                          <dd className="font-semibold text-ink">
                            {current.gate} · {current.venue}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
                          <dt className="text-ink-muted">Check-in</dt>
                          <dd className="font-semibold text-ink">QR scan, no printout needed</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-line/70 pb-2">
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
                      <span className="font-mono font-semibold text-ink">Velvet Comet</span>
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

          {/* Tactile deck actions */}
          <div className="mt-4 flex items-center justify-between gap-2 px-0.5 text-[12.5px] text-ink-muted">
            <span className="font-mono text-[11.5px] font-medium tabular-nums">
              0{index + 1} / 0{DECK.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[12.5px] font-semibold text-ink shadow-[0_1px_2px_rgba(26,26,26,0.05)] transition-colors hover:border-ink sm:min-h-[36px]"
              >
                <RotateCw className="size-3.5 text-ink-muted" aria-hidden />
                {flipped ? "Show front" : "Flip pass"}
              </button>
              <button
                type="button"
                onClick={next}
                className="group inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[12.5px] font-semibold text-ink shadow-[0_1px_2px_rgba(26,26,26,0.05)] transition-colors hover:border-ink sm:min-h-[36px]"
              >
                Next pass
                <ArrowRight
                  className="size-3.5 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>

        <MiniPrinter />
      </div>
    </div>
  );
}
