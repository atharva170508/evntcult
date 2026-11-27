"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardGreeting } from "./DashboardGreeting";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "CULTURAL", label: "Cultural" },
  { key: "TECH", label: "Tech" },
  { key: "PARTY", label: "Nightlife" },
  { key: "WORKSHOP", label: "Workshops" },
  { key: "SPORTS", label: "Sports" },
] as const;

/** Minimal signed-in empty state when the user has no active upcoming pass. */
export function EmptyTicket({
  name,
  dateLine,
  isOrganizer = false,
}: {
  name: string;
  dateLine: string;
  isOrganizer?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const current = CATEGORIES[idx];

  return (
    <section aria-labelledby="home-greeting" className="pt-2">
      <DashboardGreeting
        headline="Welcome"
        name={name}
        dateLine={dateLine}
        subtitle=""
      />

      <div className="relative overflow-hidden rounded-[6px] border border-line bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/rooftop-night.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-30"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(22,24,32,0.95) 0%, rgba(22,24,32,0.78) 60%, rgba(22,24,32,0.55) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-8 p-7 md:p-12">
          <h2 className="max-w-[14ch] font-display text-[clamp(38px,5vw,66px)] font-bold italic leading-[0.92] text-[#EFEAE0]">
            Your next pass starts <span className="text-[#D4B87A]">here.</span>
          </h2>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose category">
            {CATEGORIES.map((item, i) => {
              const active = i === idx;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "tr-meta inline-flex min-h-[42px] items-center rounded-[4px] border px-4 transition-colors",
                    active
                      ? "border-[#D4B87A] bg-[#D4B87A] text-[#161820]"
                      : "border-[#EFEAE0]/20 bg-[#161820]/60 text-[#EFEAE0]/80 hover:border-[#D4B87A] hover:text-[#D4B87A]",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/events?type=${current.key}`}
              className="group inline-flex h-12 items-center gap-2 rounded-[4px] bg-[#D4B87A] px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:bg-[#E0C78E]"
            >
              <span>Explore {current.label}</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href={isOrganizer ? "/organizer/events/new" : "/events"}
              className="inline-flex h-12 items-center rounded-[4px] border border-[#EFEAE0]/25 px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-[#EFEAE0] transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
            >
              {isOrganizer ? "Create event" : "All events"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
