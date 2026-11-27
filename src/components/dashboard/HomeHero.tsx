"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
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
const EASE_SLEEVE = [0.22, 1, 0.36, 1] as const;

/**
 * Signed-in Home hero in the Tape Room editorial system:
 * Inset rounded-24px hairline panel with full-bleed photograph, bottom scrim,
 * Gloock title bottom-left, live countdown + gold pill CTA bottom-right.
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
  const [now, setNow] = useState<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!e) return <EmptyTicket name={name} dateLine={dateLine} isOrganizer={isOrganizer} />;

  const start = Date.parse(e.startsAt);
  const end = Date.parse(e.endsAt);
  const live = now !== null && now >= start && now < end;
  const left = now === null ? null : Math.max(0, Math.floor((start - now) / 1000));
  const days = left === null ? null : Math.floor(left / 86400);
  const hms =
    left === null
      ? "--:--:--"
      : `${pad(Math.floor((left % 86400) / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  const when = `${new Date(e.startsAt).toLocaleDateString("en-IN", {
    ...IST,
    weekday: "short",
    day: "numeric",
    month: "short",
  })}, ${new Date(e.startsAt)
    .toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" })
    .toLowerCase()}`;
  const href = mine ? "/passes" : `/events/${e.slug}#register`;

  return (
    <section aria-labelledby="hero-title" className="pt-2">
      <DashboardGreeting
        headline={live ? "Doors are open" : mine ? "You are all set" : "Up next on campus"}
        name={name}
        dateLine={dateLine}
        passCount={passCount}
        subtitle={
          live
            ? "Your pass is ready to scan at the gate."
            : mine
              ? "Your next campus pass is locked in."
              : "Claim your seat in one tap."
        }
        asHeading={false}
      />

      <div className="relative overflow-hidden rounded-[24px] border border-line bg-[#1D1B18]">
        <div className="relative min-h-[clamp(420px,60vh,620px)] overflow-hidden">
          <m.img
            src={e.bannerUrl || "/images/hero-hall.jpg"}
            alt={e.title}
            fetchPriority="high"
            initial={reduce ? false : { scale: 1.03 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.1, ease: EASE_SLEEVE }}
            className="absolute inset-0 size-full object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%]"
            style={{
              background:
                "linear-gradient(to top, rgba(21,20,18,0.95) 0%, rgba(21,20,18,0.58) 52%, rgba(21,20,18,0) 100%)",
            }}
          />

          <div className="relative z-10 flex min-h-[clamp(420px,60vh,620px)] flex-col justify-between p-6 text-[#EEE8DD] md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="tr-meta inline-flex items-center gap-2 text-[#C9A26B]">
                <span className="size-1.5 rounded-full bg-[#C9A26B]" aria-hidden />
                {live ? "Live now" : mine ? "Your pass" : "Featured on campus"}
              </span>
              <span className="tr-meta text-[#EEE8DD]/80">
                {e.feePaise > 0 ? `INR ${(e.feePaise / 100).toLocaleString("en-IN")}` : "Free"}
                {e.registered > 0 ? ` · ${e.registered.toLocaleString("en-IN")} going` : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <div>
                <h1
                  id="hero-title"
                  className="font-display text-[clamp(40px,5.8vw,78px)] leading-[0.96] tracking-[-0.02em] text-[#EEE8DD]"
                >
                  {e.title}
                </h1>
                <p className="tr-meta mt-4 text-[#EEE8DD]/75">
                  {when}
                  {e.venueName ? ` · ${e.venueName}` : ""}
                  {mine && e.passSerial ? ` · ${passName(e.passSerial).name} No. ${passName(e.passSerial).no}` : ""}
                </p>
              </div>

              <div className="flex flex-col items-start gap-4 md:items-end md:text-right">
                <div>
                  <p className="tr-meta text-[#9A9284]">
                    {live ? "In progress" : mine ? "Doors open in" : "Starts in"}
                  </p>
                  <p className="mt-1 font-display text-[clamp(32px,3.6vw,48px)] leading-none tabular-nums text-[#EEE8DD]">
                    {live
                      ? "Now"
                      : days !== null && days >= 1
                        ? `${days}d ${hms}`
                        : hms}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link href={href} className="group inline-flex items-center gap-2">
                    <span className="inline-flex h-12 items-center rounded-full bg-[#C9A26B] px-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412] transition-colors group-hover:bg-[#D7B47F]">
                      {live ? (mine ? "Show pass" : "Go now") : mine ? "Open pass" : "Claim seat"}
                    </span>
                    <span
                      aria-hidden
                      className="grid size-12 place-items-center rounded-full bg-[#C9A26B] text-[#151412] transition-transform duration-base ease-out group-hover:translate-x-1 group-hover:bg-[#D7B47F]"
                    >
                      <ArrowUpRight className="size-4" strokeWidth={1.75} />
                    </span>
                  </Link>
                  <Link
                    href={`/events/${e.slug}`}
                    className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#EEE8DD]/80 hover:text-[#C9A26B]"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
