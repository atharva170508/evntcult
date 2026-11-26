"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { EASE } from "@/components/motion/MotionProvider";
import { EmptyTicket } from "./EmptyTicket";
import { DashboardGreeting } from "./DashboardGreeting";
import { passName } from "@/lib/pass-name";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { TextScramble } from "@/components/shadcn/text-scramble";
import { SlidingNumber } from "@/components/shadcn/sliding-number";
import { GlowEffect } from "@/components/shadcn/glow-effect";
import { TextShimmer } from "@/components/shadcn/text-shimmer";
import { TextLoop } from "@/components/shadcn/text-loop";
import { ProgressiveBlur } from "@/components/shadcn/progressive-blur";
import { QOUT } from "@/lib/motion-curves";

export type HeroEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  venueName: string | null;
  accent: string;
  bannerUrl?: string | null;
  registered: number;
  feePaise: number;
  passSerial?: string | null;
};

const IST = { timeZone: "Asia/Kolkata" } as const;
const pad = (n: number) => String(n).padStart(2, "0");

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The first thing on Home: your next event as one giant tear-off ticket. The body carries the
 * poster and the name; the perforated stub carries a live countdown and the one action. With no
 * pass yet, the stub offers the best event coming up instead ("Claim your seat").
 */
export function HomeHero({ e, mine, dateLine, name, isOrganizer = false }: { e: HeroEvent | null; mine: boolean; dateLine: string; name: string; isOrganizer?: boolean }) {
  const now = useNow();
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 40, on: false });

  if (!e) return <EmptyTicket name={name} dateLine={dateLine} isOrganizer={isOrganizer} />;

  const onHeroMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || ev.pointerType !== "mouse") return;
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * 100;
    const py = ((ev.clientY - r.top) / r.height) * 100;
    setTilt({
      rx: ((50 - py) / 50) * 2.4,
      ry: ((px - 50) / 50) * 2.8,
      gx: px,
      gy: py,
      on: true,
    });
  };
  const onHeroLeave = () => setTilt((t) => ({ ...t, rx: 0, ry: 0, on: false }));

  const start = Date.parse(e.startsAt);
  const end = Date.parse(e.endsAt);
  const live = now !== null && now >= start && now < end;
  const left = now === null ? null : Math.max(0, Math.floor((start - now) / 1000));
  const days = left === null ? null : Math.floor(left / 86400);
  const hms = left === null ? "--:--:--" : `${pad(Math.floor((left % 86400) / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  const tone = accentHex(e.accent);
  const when = `${new Date(e.startsAt).toLocaleDateString("en-IN", { ...IST, weekday: "short", day: "numeric", month: "short" })}, ${new Date(e.startsAt).toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" }).toLowerCase()}`;
  const href = mine ? "/passes" : `/events/${e.slug}#register`;

  return (
    <section aria-labelledby="hero-title" className="pt-6 md:pt-10">
      <DashboardGreeting
        headline={live ? "Doors are open" : mine ? "You're all set" : "Up next on campus"}
        name={name}
        dateLine={dateLine}
        subtitle={live ? "Your pass is ready to scan at the gate." : mine ? "Your next campus pass is locked in." : "Claim your seat in one tap."}
        asHeading={false}
      />

      <div
        className="relative"
        style={{ perspective: 1400 }}
        onPointerMove={onHeroMove}
        onPointerLeave={onHeroLeave}
      >
        {!reduce && (
          <GlowEffect
            colors={["#F0D7FF", "#E3264F", "#F0D7FF"]}
            mode="breathe"
            blur="strongest"
            className="pointer-events-none -inset-1 rounded-[32px] opacity-20 dark:opacity-30"
          />
        )}
      <m.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0, rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={
          tilt.on
            ? { type: "spring", stiffness: 220, damping: 24 }
            : { duration: 0.6, ease: EASE }
        }
        className="hero-ticket relative grid overflow-hidden rounded-[28px] shadow-[0_40px_80px_-48px_rgba(40,25,5,.55),0_0_0_1px_rgba(26,26,26,.06)] dark:shadow-[0_44px_96px_-36px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.14)] md:grid-cols-[minmax(0,1fr)_320px]"
      >
        {!reduce && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              opacity: tilt.on ? 1 : 0,
              background: `radial-gradient(480px circle at ${tilt.gx}% ${tilt.gy}%, rgba(240,215,255,0.18), transparent 58%)`,
            }}
          />
        )}
        {!reduce && (
          <BorderTrail
            size={104}
            className="z-20 bg-gradient-to-l from-[#E3264F] via-[#F0D7FF] to-transparent opacity-75"
            transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
          />
        )}
        {/* Body: the poster and the name */}
        <Link href={`/events/${e.slug}`} className="group relative block min-h-[320px] overflow-hidden md:min-h-[410px]" style={{ background: tone }}>
          <m.div
            initial={reduce ? false : { scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.15, ease: QOUT }}
            className="absolute inset-0"
          >
            <div className="size-full transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]">
              {e.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.bannerUrl} alt="" className="size-full object-cover" />
              ) : (
                <EventArt accent={e.accent} seed={e.id} scrim={false} />
              )}
            </div>
          </m.div>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.22)_0%,rgba(10,9,8,0.08)_35%,rgba(10,9,8,0.78)_100%)]" />
          <ProgressiveBlur
            direction="bottom"
            blurLayers={5}
            blurIntensity={0.65}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
          />
          <div className="relative flex h-full min-h-[320px] flex-col justify-between p-6 text-[#FFFEF6] md:min-h-[410px] md:p-9">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-[#EDE3DA] backdrop-blur-md">
                {live ? (
                  <>
                    <span className="size-1.5 animate-pulse rounded-full bg-[#FF5C7A]" aria-hidden />
                    <TextShimmer as="span" className="[--base-color:#FFFEF6] [--base-gradient-color:#F0D7FF]">
                      Happening now
                    </TextShimmer>
                  </>
                ) : mine ? (
                  "ADMIT ONE · YOUR PASS"
                ) : (
                  "FEATURED ON CAMPUS"
                )}
              </span>
              <span className="hidden rounded-full border border-white/15 bg-black/30 px-2.5 py-1 font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#F0D7FF]/90 backdrop-blur-md sm:inline-flex">
                EVNTCULT
              </span>
            </div>

            <div>
              <h1 id="hero-title" className="max-w-[14ch] font-display text-[clamp(42px,5.8vw,78px)] leading-[0.94] tracking-[-0.03em] drop-shadow-[0_6px_28px_rgba(0,0,0,0.45)]">
                {e.title}
              </h1>
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15.5px] text-[#FFFEF6]/90">
                <span>{when}</span>
                {e.venueName && <span>{e.venueName}</span>}
                <ArrowUpRight className="size-4 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
              </p>
            </div>
          </div>
        </Link>

        {/* Stub: Obsidian Twilight frosted glass stub in dark mode, warm paper in light mode */}
        <m.div
          initial={reduce ? false : { x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="hero-stub relative flex flex-col justify-between overflow-hidden bg-[#FFFEF6] p-6 text-[#1A1A1A] dark:bg-[#161412]/92 dark:text-[#EDE3DA] dark:backdrop-blur-2xl md:p-7"
        >
          {/* Ambient radial glow inside dark stub */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 hidden size-44 rounded-full bg-[#F0D7FF]/12 blur-3xl dark:block"
          />
          <div className="relative z-10">
            <div className="text-[13.5px] font-medium text-[#6A6A6A] dark:text-[#A99F96]">
              {live ? (
                "Doors are open"
              ) : mine ? (
                <TextLoop interval={3.2}>
                  <span>Doors open in</span>
                  <span>Offline QR ready</span>
                  <span>Auto .ics synced</span>
                </TextLoop>
              ) : (
                "Starts in"
              )}
            </div>
            {live ? (
              <>
                <p className="mt-1 font-display text-[88px] leading-[0.85] tracking-[-0.04em] text-[#1A1A1A] dark:text-[#EDE3DA]">Now</p>
                <p className="mt-3 text-[14.5px] text-[#3F3F3F] dark:text-[#C4BAB0]">
                  Started {Math.max(1, Math.round(((now ?? start) - start) / 60000)) >= 60 ? `${Math.round(((now ?? start) - start) / 3600000)} h` : `${Math.max(1, Math.round(((now ?? start) - start) / 60000))} min`} ago, ends at{" "}
                  {new Date(e.endsAt).toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" }).toLowerCase()}
                </p>
              </>
            ) : days !== null && days >= 1 ? (
              <>
                <p className="mt-1 flex items-baseline gap-2 text-[#1A1A1A] dark:text-[#EDE3DA]">
                  <span className="font-display text-[104px] leading-[0.8] tracking-[-0.05em] tabular-nums">
                    {reduce ? days : <SlidingNumber value={days} />}
                  </span>
                  <span className="font-display text-[28px]">{days === 1 ? "day" : "days"}</span>
                </p>
                <p className="mt-3 font-mono text-[20px] tabular-nums tracking-[0.04em] text-[#3F3F3F] dark:text-[#F0D7FF]" aria-live="off">
                  {hms}
                </p>
              </>
            ) : (
              <p className="mt-2 font-mono text-[44px] leading-none tabular-nums tracking-[0.02em] text-[#1A1A1A] dark:text-[#F0D7FF]" aria-live="off">
                {hms}
              </p>
            )}
          </div>

          <div className="relative z-10 mt-8">
            {mine && e.passSerial && (
              <p className="mb-3">
                <span className="block font-display text-[22px] leading-tight text-[#1A1A1A] dark:text-[#EDE3DA]">
                  {reduce ? passName(e.passSerial).name : <TextScramble>{passName(e.passSerial).name}</TextScramble>}
                </span>
                <span className="block font-mono text-[12px] tabular-nums text-[#6A6A6A] dark:text-[#A99F96]">No. {passName(e.passSerial).no}</span>
              </p>
            )}
            {!mine && (
              <p className="mb-3 text-[13.5px] text-[#6A6A6A] dark:text-[#A99F96]">
                {e.feePaise > 0 ? `₹${(e.feePaise / 100).toLocaleString("en-IN")}` : "Free"}
                {e.registered > 0 ? `, ${e.registered.toLocaleString("en-IN")} going` : ""}
              </p>
            )}
            <Link
              href={href}
              className={
                mine
                  ? "ui-press flex h-12 items-center justify-center rounded-xl bg-[#1A1A1A] text-[15.5px] font-semibold text-[#FFFEF6] transition-all hover:opacity-95 active:scale-[0.98] dark:bg-[#EDE3DA] dark:text-[#121110] dark:shadow-[0_10px_28px_-8px_rgba(237,227,218,0.45)]"
                  : "ui-press flex h-12 items-center justify-center rounded-xl bg-[#F0D7FF] text-[15.5px] font-semibold text-[#121110] ring-2 ring-inset ring-[#1A1A1A] transition-all hover:bg-[#F6E6FF] active:scale-[0.98] dark:ring-white/25 dark:shadow-[0_10px_28px_-6px_rgba(240,215,255,0.45)]"
              }
            >
              {live ? (mine ? "Show pass at the gate" : "Go now") : mine ? "Show pass" : "Claim your seat"}
            </Link>
          </div>
        </m.div>
      </m.div>
      </div>
    </section>
  );
}
