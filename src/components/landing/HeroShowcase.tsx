"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, CheckCircle2, RotateCw, ShieldCheck, WifiOff } from "lucide-react";
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
  accentHex: string;
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
    accentHex: "#F59B6C",
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
    accentHex: "#7AB2FF",
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
    accentHex: "#F5B25E",
  },
];

const BARCODE_WEIGHTS = [
  2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2,
];

/**
 * Full-width Obsidian Gallery Theater:
 * Left rail — Curated pass index & flip controls.
 * Center stage — Museum-lit physical 3D-tilt cardstock pass with bespoke artwork & foil strip.
 * Right bay — Live offline gate verification card & integrated thermal ticket printer.
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
      x: (0.5 - py) * 12,
      y: (px - 0.5) * 15,
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
    <div className="relative overflow-hidden rounded-[32px] bg-[#12110F] text-[#F5F1E8] shadow-[0_44px_100px_-42px_rgba(20,14,6,0.72),0_0_0_1px_rgba(255,255,255,0.08)] dark:bg-[#191714] dark:shadow-[0_44px_100px_-42px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)]">
      {/* Subtle overhead museum spotlight + fine architectural hairlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(62% 72% at 50% 0%, rgba(255,246,228,0.09) 0%, rgba(255,246,228,0.02) 45%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {/* Top theater bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.09] px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-2.5 text-[12.5px] font-medium text-[#D6D0C4]">
          <span className="size-2 rounded-full bg-[#5EE0A8]" aria-hidden />
          <span className="font-semibold text-[#FAF7F0]">Interactive pass showcase</span>
          <span className="hidden text-white/25 sm:inline" aria-hidden>·</span>
          <span className="hidden text-[#A8A296] sm:inline">Move pointer to tilt, click to flip or print</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11.5px] tabular-nums text-[#BDB7AA]">
          <span>{current.serial}</span>
          <span className="text-white/20" aria-hidden>/</span>
          <span>0{index + 1} of 0{DECK.length}</span>
        </div>
      </div>

      {/* 3-Zone Theater Grid */}
      <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[260px_minmax(0,1fr)_240px] lg:gap-8 xl:grid-cols-[285px_minmax(0,1fr)_255px]">
        {/* Zone 1: Curated Pass Ledger */}
        <div className="flex flex-col justify-between self-stretch">
          <div>
            <p className="text-[12.5px] font-medium text-[#A8A296]">
              Select an example pass
            </p>
            <div
              role="tablist"
              aria-label="Choose example pass"
              className="mt-3 divide-y divide-white/[0.09] border-y border-white/[0.09]"
            >
              {DECK.map((item, i) => {
                const active = i === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => select(i)}
                    className={cn(
                      "group relative flex min-h-[68px] w-full items-center gap-3.5 px-3 py-3 text-left transition-colors duration-200",
                      active
                        ? "bg-white/[0.07] text-[#FAF7F0]"
                        : "text-[#B6B0A4] hover:bg-white/[0.035] hover:text-[#FAF7F0]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-8 w-[3px] shrink-0 rounded-full transition-opacity duration-200",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                      )}
                      style={{ background: item.accentHex }}
                    />
                    <span className="font-mono text-[11.5px] font-medium tabular-nums text-[#9B9589]">
                      0{i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[22px] leading-[1.05] text-inherit">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[#A8A296]">
                        {item.venue} · {item.date}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tactile stage controls */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5 lg:mt-6">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold text-[#FAF7F0] transition-colors hover:border-white/35 hover:bg-white/[0.11]"
            >
              <RotateCw className="size-3.5 text-[#D6D0C4]" aria-hidden />
              {flipped ? "Show front" : "Flip pass"}
            </button>
            <button
              type="button"
              onClick={next}
              className="group inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold text-[#FAF7F0] transition-colors hover:border-white/35 hover:bg-white/[0.11]"
            >
              Next
              <ArrowRight
                className="size-3.5 text-[#D6D0C4] transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* Zone 2: Centerpiece Floating Physical Pass Card */}
        <div className="mx-auto w-full max-w-[390px]">
          <div style={{ perspective: 1300 }} className="relative">
            {/* Subtle layered cardstock shadows behind */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={next}
              className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rotate-[2.6deg] rounded-[24px] border border-white/10 bg-[#23201C] transition-transform duration-300 hover:translate-x-4 hover:rotate-[4deg]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-20 -translate-x-2.5 translate-y-2 -rotate-[2deg] rounded-[24px] border border-white/[0.06] bg-[#1A1815]"
            />

            <AnimatePresence mode="popLayout" initial={false}>
              <m.div
                key={current.id}
                initial={{ opacity: 0, y: 12, scale: 0.965, rotate: -1.4 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.965, rotate: 1.4 }}
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
                  <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_40px_80px_-24px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.22)] [backface-visibility:hidden]">
                    {/* Optical specular & metallic tilt sheen */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
                      style={{
                        opacity: tilt.active ? 0.65 : 0,
                        background: `radial-gradient(280px circle at ${tilt.mx}% ${tilt.my}%, rgba(255,254,246,0.52), rgba(240,215,255,0.18) 42%, transparent 70%)`,
                      }}
                    />

                    {/* Editorial poster header */}
                    <div className="relative aspect-[16/10]">
                      <HeroPassArt kind={current.art} />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 via-black/32 to-transparent p-5 pt-14">
                        <p className="text-[12px] font-medium text-white/85">
                          {current.edition}
                        </p>
                        <p className="mt-1 font-display text-[36px] leading-[0.94] tracking-[-0.02em] text-white">
                          {current.title}
                        </p>
                      </div>
                      <div className="absolute left-4 top-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1A1A1A] shadow-sm">
                          <ShieldCheck className="size-3 text-[#0B7A54]" aria-hidden />
                          Example pass
                        </span>
                      </div>
                    </div>

                    {/* Pointer-reactive metallic foil security band */}
                    <div
                      aria-hidden
                      className="h-[3.5px] w-full"
                      style={{
                        background: `linear-gradient(90deg, #E7DFCE 0%, #F0D7FF ${Math.max(16, Math.min(80, tilt.mx))}%, #FFE0A3 ${Math.max(28, Math.min(92, tilt.mx + 14))}%, #E7DFCE 100%)`,
                      }}
                    />

                    {/* True obsidian-matched perforated tear divider */}
                    <div className="relative flex items-center bg-white py-1">
                      <span
                        className="size-4 -translate-x-1/2 rounded-full bg-[#12110F] dark:bg-[#191714]"
                        aria-hidden
                      />
                      <div className="mx-1.5 flex-1 border-t border-dashed border-[#D6CFC0]" />
                      <span
                        className="size-4 translate-x-1/2 rounded-full bg-[#12110F] dark:bg-[#191714]"
                        aria-hidden
                      />
                    </div>

                    {/* Cardstock ticket body */}
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 pb-4 pt-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-[#666666]">
                          {current.seat}
                        </p>
                        <p className="mt-0.5 truncate font-display text-[30px] leading-none text-[#1A1A1A]">
                          {current.holder}
                        </p>
                        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                          <div>
                            <dt className="text-[11px] text-[#666666]">Date</dt>
                            <dd className="whitespace-nowrap font-semibold tabular-nums text-[#1A1A1A]">
                              {current.date}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-[#666666]">Doors</dt>
                            <dd className="whitespace-nowrap font-semibold tabular-nums text-[#1A1A1A]">
                              {current.doors}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[11px] text-[#666666]">Venue</dt>
                            <dd className="truncate font-semibold text-[#1A1A1A]">
                              {current.venue}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Framed QR housing */}
                      <div className="relative shrink-0 rounded-[14px] bg-white p-2 shadow-[inset_0_0_0_1px_rgba(26,26,26,0.1)]">
                        <div
                          className="size-[104px] overflow-hidden rounded-[8px] bg-white [&>svg]:size-full"
                          dangerouslySetInnerHTML={{ __html: qr }}
                        />
                      </div>
                    </div>

                    {/* Thermal bottom barcode footer */}
                    <div className="flex items-center justify-between border-t border-[#ECE8DD] bg-[#FAF8F2] px-5 py-2.5">
                      <div className="flex h-3 items-stretch gap-[1.5px] opacity-55" aria-hidden>
                        {BARCODE_WEIGHTS.map((w, idx) => (
                          <span
                            key={idx}
                            className="bg-[#1A1A1A]"
                            style={{ width: `${w}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[10.5px] font-medium tabular-nums text-[#666666]">
                        {current.serial} · {current.gate}
                      </span>
                    </div>
                  </div>

                  {/* Back face (Apple Wallet style reverse details) */}
                  <div
                    aria-hidden={!flipped}
                    className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[24px] bg-white p-6 text-[#1A1A1A] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.22)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-[#ECE8DD] pb-3">
                        <span className="text-[12px] font-semibold text-[#666666]">
                          Pass details · {current.serial}
                        </span>
                        <span className="rounded-full bg-[#E3F3EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#0B7A54]">
                          Offline ready
                        </span>
                      </div>
                      <p className="mt-4 font-display text-[32px] leading-none text-[#1A1A1A]">
                        {current.title}
                      </p>
                      <dl className="mt-4 space-y-2.5 text-[13px]">
                        <div className="flex justify-between gap-3 border-b border-[#ECE8DD] pb-2">
                          <dt className="text-[#666666]">Entry desk</dt>
                          <dd className="font-semibold text-[#1A1A1A]">
                            {current.gate} · {current.venue}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-[#ECE8DD] pb-2">
                          <dt className="text-[#666666]">Check-in</dt>
                          <dd className="font-semibold text-[#1A1A1A]">QR scan, no printout needed</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-b border-[#ECE8DD] pb-2">
                          <dt className="text-[#666666]">Photos</dt>
                          <dd className="font-semibold text-[#1A1A1A]">Auto-delivered to Photo Vault</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-[#666666]">Transfer</dt>
                          <dd className="font-semibold text-[#1A1A1A]">Cancel anytime from My Passes</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#ECE8DD] pt-3 text-[12px] text-[#666666]">
                      <span className="font-mono font-semibold text-[#1A1A1A]">Velvet Comet</span>
                      <button
                        type="button"
                        onClick={() => setFlipped(false)}
                        className="font-semibold text-[#1A1A1A] underline underline-offset-4"
                      >
                        Back to front
                      </button>
                    </div>
                  </div>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Zone 3: Hardware Pass Bay (Gate Telemetry + Thermal Printer) */}
        <div className="flex flex-col items-center justify-between gap-5 self-stretch rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
          <div className="w-full space-y-2.5 border-b border-white/[0.08] pb-4 text-[12.5px]">
            <div className="flex items-center justify-between text-[#D6D0C4]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#FAF7F0]">
                <CheckCircle2 className="size-3.5 text-[#5EE0A8]" aria-hidden />
                Gate scanner ready
              </span>
              <span className="font-mono text-[11px] text-[#A8A296]">{current.gate}</span>
            </div>
            <p className="flex items-center gap-1.5 text-[12px] leading-snug text-[#A8A296]">
              <WifiOff className="size-3.5 shrink-0 text-[#BDB7AA]" aria-hidden />
              Signed QR verifies offline in under a second
            </p>
          </div>

          <MiniPrinter />
        </div>
      </div>
    </div>
  );
}
