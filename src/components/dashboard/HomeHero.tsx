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
export function HomeHero({ e, mine, dateLine, name }: { e: HeroEvent | null; mine: boolean; dateLine: string; name: string }) {
  const now = useNow();
  const reduce = useReducedMotion();

  if (!e) return <EmptyTicket name={name} dateLine={dateLine} />;

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
        name={name}
        dateLine={dateLine}
        subtitle={live ? "Doors are open — your pass is ready at the gate." : mine ? "Your next campus pass is locked in." : "Here's what's coming up next on campus."}
        asHeading={false}
      />

      <m.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="hero-ticket paper-keep relative grid overflow-hidden rounded-[28px] shadow-[0_40px_80px_-48px_rgba(40,25,5,.55),0_0_0_1px_rgba(26,26,26,.06)] md:grid-cols-[minmax(0,1fr)_300px]"
      >
        {/* Body: the poster and the name */}
        <Link href={`/events/${e.slug}`} className="group relative block min-h-[300px] overflow-hidden md:min-h-[380px]" style={{ background: tone }}>
          <div className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-enter)] group-hover:scale-[1.03]">
            {e.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.bannerUrl} alt="" className="size-full object-cover" />
            ) : (
              <EventArt accent={e.accent} seed={e.id} scrim={false} />
            )}
          </div>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_20%,rgba(0,0,0,.62)_100%)]" />
          <div className="relative flex h-full min-h-[300px] flex-col justify-end p-6 text-[#FFFEF6] md:min-h-[380px] md:p-9">
            <p className="text-[14px] font-semibold text-[#FFFEF6]/85">
              {live ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 animate-pulse rounded-full bg-[#FF5C7A]" aria-hidden /> Happening now
                </span>
              ) : mine ? (
                "Your next pass"
              ) : (
                "Worth going to"
              )}
            </p>
            <h1 id="hero-title" className="mt-2 max-w-[14ch] font-display text-[clamp(40px,5.6vw,76px)] leading-[0.95] tracking-[-0.03em]">
              {e.title}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15.5px] text-[#FFFEF6]/85">
              <span>{when}</span>
              {e.venueName && <span>{e.venueName}</span>}
              <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </p>
          </div>
        </Link>

        {/* Stub: the countdown and the one action */}
        <m.div
          initial={reduce ? false : { x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="hero-stub relative flex flex-col justify-between bg-[#FFFEF6] p-6 md:p-7"
        >
          <div>
            <p className="text-[13.5px] font-medium text-[#6A6A6A]">{live ? "Doors are open" : mine ? "Doors open in" : "Starts in"}</p>
            {live ? (
              <>
                <p className="mt-1 font-display text-[88px] leading-[0.85] tracking-[-0.04em] text-[#1A1A1A]">Now</p>
                <p className="mt-3 text-[14.5px] text-[#3F3F3F]">
                  Started {Math.max(1, Math.round(((now ?? start) - start) / 60000)) >= 60 ? `${Math.round(((now ?? start) - start) / 3600000)} h` : `${Math.max(1, Math.round(((now ?? start) - start) / 60000))} min`} ago, ends at{" "}
                  {new Date(e.endsAt).toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" }).toLowerCase()}
                </p>
              </>
            ) : days !== null && days >= 1 ? (
              <>
                <p className="mt-1 flex items-baseline gap-2 text-[#1A1A1A]">
                  <span className="font-display text-[104px] leading-[0.8] tracking-[-0.05em] tabular-nums">{days}</span>
                  <span className="font-display text-[28px]">{days === 1 ? "day" : "days"}</span>
                </p>
                <p className="mt-3 font-mono text-[20px] tabular-nums tracking-[0.04em] text-[#3F3F3F]" aria-live="off">
                  {hms}
                </p>
              </>
            ) : (
              <p className="mt-2 font-mono text-[44px] leading-none tabular-nums tracking-[0.02em] text-[#1A1A1A]" aria-live="off">
                {hms}
              </p>
            )}
          </div>

          <div className="mt-8">
            {mine && e.passSerial && (
              <p className="mb-3">
                <span className="block font-display text-[22px] leading-tight text-[#1A1A1A]">{passName(e.passSerial).name}</span>
                <span className="block text-[12.5px] tabular-nums text-[#6A6A6A]">No. {passName(e.passSerial).no}</span>
              </p>
            )}
            {!mine && (
              <p className="mb-3 text-[13.5px] text-[#6A6A6A]">
                {e.feePaise > 0 ? `₹${(e.feePaise / 100).toLocaleString("en-IN")}` : "Free"}
                {e.registered > 0 ? `, ${e.registered.toLocaleString("en-IN")} going` : ""}
              </p>
            )}
            <Link
              href={href}
              className={
                mine
                  ? "flex h-12 items-center justify-center rounded-xl bg-[#1A1A1A] text-[15.5px] font-semibold text-[#FFFEF6] transition-transform active:scale-[0.98]"
                  : "flex h-12 items-center justify-center rounded-xl bg-[#F0D7FF] text-[15.5px] font-semibold text-[#1A1A1A] ring-2 ring-inset ring-[#1A1A1A] transition-transform active:scale-[0.98]"
              }
            >
              {live ? (mine ? "Show pass at the gate" : "Go now") : mine ? "Show pass" : "Claim your seat"}
            </Link>
          </div>
        </m.div>
      </m.div>
    </section>
  );
}
