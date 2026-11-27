"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { EASE } from "@/components/motion/MotionProvider";
import { EmptyTicket } from "./EmptyTicket";
import { DashboardGreeting } from "./DashboardGreeting";
import { passName } from "@/lib/pass-name";

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

function StubBarcode() {
  const bars = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 2];
  return (
    <div aria-hidden className="flex h-5 items-stretch gap-[2px] opacity-65">
      {bars.map((w, idx) => (
        <span key={idx} className="rounded-[0.5px] bg-[#1A1A1A]" style={{ width: `${w}px` }} />
      ))}
    </div>
  );
}

/**
 * Signed-in Home centerpiece: your next event rendered as a tactile tear-off boarding pass.
 * The poster side carries the artwork, admission stamp, and venue; the perforated stub carries
 * the live countdown, pass serial, barcode, and primary gate action.
 */
export function HomeHero({
  e,
  mine,
  dateLine,
  name,
  passCount = 0,
  isOrganizer = false,
}: {
  e: HeroEvent | null;
  mine: boolean;
  dateLine: string;
  name: string;
  passCount?: number;
  isOrganizer?: boolean;
}) {
  const now = useNow();
  const reduce = useReducedMotion();
  const [glare, setGlare] = useState({ x: 50, y: 35, on: false });

  if (!e) return <EmptyTicket name={name} dateLine={dateLine} isOrganizer={isOrganizer} />;

  const onMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || ev.pointerType !== "mouse") return;
    const r = ev.currentTarget.getBoundingClientRect();
    setGlare({
      x: ((ev.clientX - r.left) / r.width) * 100,
      y: ((ev.clientY - r.top) / r.height) * 100,
      on: true,
    });
  };
  const onLeave = () => setGlare((g) => ({ ...g, on: false }));

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
        passCount={passCount}
        subtitle={live ? "Your pass is ready to scan at the gate." : mine ? "Your next campus pass is locked in." : "Claim your seat in one tap."}
        asHeading={false}
      />

      <m.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="hero-ticket paper-keep relative grid overflow-hidden rounded-[28px] shadow-[0_36px_74px_-42px_rgba(40,25,5,.52),0_0_0_1px_rgba(26,26,26,.08)] md:grid-cols-[minmax(0,1fr)_324px]"
      >
        {!reduce && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              opacity: glare.on ? 0.45 : 0,
              background: `radial-gradient(420px circle at ${glare.x}% ${glare.y}%, rgba(255,254,246,0.22), transparent 60%)`,
            }}
          />
        )}

        {/* Body: the poster and event facts */}
        <Link href={`/events/${e.slug}`} className="group relative block min-h-[320px] overflow-hidden md:min-h-[400px]" style={{ background: tone }}>
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
            {e.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.bannerUrl} alt="" fetchPriority="high" className="size-full object-cover" />
            ) : (
              <EventArt accent={e.accent} seed={e.id} scrim={false} />
            )}
          </div>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,14,12,0.28)_0%,rgba(16,14,12,0.08)_36%,rgba(16,14,12,0.82)_100%)]" />
          <div className="relative flex h-full min-h-[320px] flex-col justify-between p-6 text-[#FFFEF6] md:min-h-[400px] md:p-9">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#FFFEF6]/95 px-3 py-1 text-[12px] font-semibold text-[#1A1A1A] shadow-sm">
                {live ? (
                  <>
                    <span className="size-2 rounded-full bg-[#E3264F]" aria-hidden />
                    Happening now
                  </>
                ) : mine ? (
                  "Admit one · Your pass"
                ) : (
                  "Featured on campus"
                )}
              </span>
              <span className="rounded-lg bg-black/50 px-2.5 py-1 font-mono text-[12px] font-medium text-[#FFFEF6] backdrop-blur-sm">
                {e.feePaise > 0 ? `₹${(e.feePaise / 100).toLocaleString("en-IN")}` : "Free"}
                {e.registered > 0 ? ` · ${e.registered.toLocaleString("en-IN")} going` : ""}
              </span>
            </div>

            <div>
              <h1 id="hero-title" className="max-w-[14ch] font-display text-[clamp(42px,5.6vw,78px)] leading-[0.94] tracking-[-0.02em]">
                {e.title}
              </h1>
              <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[15px] font-medium text-[#FFFEF6]/92">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 opacity-85" aria-hidden />
                  {when}
                </span>
                {e.venueName && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 opacity-85" aria-hidden />
                    {e.venueName}
                  </span>
                )}
                <ArrowUpRight className="size-4 opacity-70 transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
              </p>
            </div>
          </div>
        </Link>

        {/* Stub: live countdown, barcode & primary gate action */}
        <div className="hero-stub relative flex flex-col justify-between bg-[#FFFEF6] p-6 md:p-7">
          <div>
            <p className="text-[13px] font-semibold text-[#666666]">
              {live ? "Doors are open" : mine ? "Doors open in" : "Starts in"}
            </p>
            {live ? (
              <>
                <p className="mt-1 font-display text-[88px] leading-[0.86] tracking-[-0.03em] text-[#1A1A1A]">Now</p>
                <p className="mt-3 text-[14.5px] text-[#3F3F3F]">
                  Started {Math.max(1, Math.round(((now ?? start) - start) / 60000)) >= 60 ? `${Math.round(((now ?? start) - start) / 3600000)} h` : `${Math.max(1, Math.round(((now ?? start) - start) / 60000))} min`} ago, ends at{" "}
                  {new Date(e.endsAt).toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" }).toLowerCase()}
                </p>
              </>
            ) : days !== null && days >= 1 ? (
              <>
                <p className="mt-1 flex items-baseline gap-2 text-[#1A1A1A]">
                  <span className="font-display text-[104px] leading-[0.82] tracking-[-0.03em] tabular-nums">{days}</span>
                  <span className="font-display text-[28px]">{days === 1 ? "day" : "days"}</span>
                </p>
                <p className="mt-3 font-mono text-[19px] font-medium tabular-nums tracking-[0.04em] text-[#3F3F3F]" aria-live="off">
                  {hms}
                </p>
              </>
            ) : (
              <p className="mt-2 font-mono text-[44px] leading-none tabular-nums tracking-[0.02em] text-[#1A1A1A]" aria-live="off">
                {hms}
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-dashed border-[#DCD6C6] pt-5">
            {mine && e.passSerial ? (
              <div className="mb-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="block truncate font-display text-[24px] leading-tight text-[#1A1A1A]">
                    {passName(e.passSerial).name}
                  </span>
                  <span className="block font-mono text-[12px] tabular-nums text-[#666666]">
                    No. {passName(e.passSerial).no}
                  </span>
                </div>
                <StubBarcode />
              </div>
            ) : (
              <p className="mb-4 text-[13.5px] font-medium text-[#666666]">
                {e.feePaise > 0 ? `₹${(e.feePaise / 100).toLocaleString("en-IN")}` : "Free entry"}
                {e.registered > 0 ? ` · ${e.registered.toLocaleString("en-IN")} students going` : ""}
              </p>
            )}
            <Link
              href={href}
              className={
                mine
                  ? "ui-press flex h-12 items-center justify-center rounded-xl bg-[#1A1A1A] text-[15.5px] font-semibold text-[#FFFEF6] transition-colors hover:bg-black"
                  : "ui-press flex h-12 items-center justify-center rounded-xl bg-[#F0D7FF] text-[15.5px] font-semibold text-[#1A1A1A] ring-2 ring-inset ring-[#1A1A1A] transition-colors hover:bg-[#E6C4FB]"
              }
            >
              {live ? (mine ? "Show pass at the gate" : "Go now") : mine ? "Show pass" : "Claim your seat"}
            </Link>
            <Link
              href={`/events/${e.slug}`}
              className="mt-2.5 flex min-h-[36px] items-center justify-center text-[13px] font-semibold text-[#3F3F3F] underline decoration-[#DCD6C6] underline-offset-4 transition-colors hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
            >
              View event details
            </Link>
          </div>
        </div>
      </m.div>
    </section>
  );
}
