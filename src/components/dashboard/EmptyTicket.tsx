"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DashboardGreeting } from "./DashboardGreeting";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "CULTURAL", label: "Cultural", sample: "Garba Under Stars", venue: "Central Quad", slot: "Sat · 7:00 pm" },
  { key: "TECH", label: "Hackathons", sample: "HackNight 26", venue: "Main Auditorium", slot: "Fri · 6:30 pm" },
  { key: "PARTY", label: "Concerts", sample: "Sunset Sessions", venue: "Riverside Lawn", slot: "Sat · 8:00 pm" },
  { key: "WORKSHOP", label: "Workshops", sample: "Design Critique", venue: "Studio Hall", slot: "Sun · 11:00 am" },
  { key: "SPORTS", label: "Sports", sample: "Floodlight Finals", venue: "North Turf", slot: "Sun · 6:00 pm" },
] as const;

/** Signed-in empty pass state styled in the Tape Room dark-surface-paper-gold grammar. */
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
        headline="Your board is open"
        name={name}
        dateLine={dateLine}
        subtitle="Pick a category below to find your next event."
      />

      <div className="grid grid-cols-1 gap-10 rounded-[24px] border border-line bg-surface p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center md:p-12">
        <div>
          <p className="tr-meta text-ink-muted">No active passes yet</p>
          <h2 className="mt-4 font-display text-[clamp(34px,4.4vw,56px)] leading-[0.98] tracking-[-0.02em] text-ink">
            Your first pass is waiting for a <em className="italic text-[#C9A26B]">night out</em>.
          </h2>

          <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Choose category">
            {CATEGORIES.map((item, i) => {
              const active = i === idx;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "tr-meta inline-flex min-h-[44px] items-center rounded-full border px-4 transition-colors",
                    active
                      ? "border-[#C9A26B] bg-[#C9A26B] text-[#151412]"
                      : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link href={`/events?type=${current.key}`} className="group inline-flex items-center gap-2">
              <span className="inline-flex h-12 items-center rounded-full bg-[#C9A26B] px-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412] transition-colors group-hover:bg-[#D7B47F]">
                See {current.label}
              </span>
              <span
                aria-hidden
                className="grid size-12 place-items-center rounded-full bg-[#C9A26B] text-[#151412] transition-transform duration-base ease-out group-hover:translate-x-1 group-hover:bg-[#D7B47F]"
              >
                <ArrowUpRight className="size-4" strokeWidth={1.75} />
              </span>
            </Link>
            <Link
              href={isOrganizer ? "/organizer/events/new" : "/events"}
              className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink"
            >
              {isOrganizer ? "Create an event" : "Browse all events"}
            </Link>
          </div>
        </div>

        {/* Archival paper pass preview */}
        <div className="tr-paper rounded-[8px] border border-line bg-[#EEE8DD] p-6 text-[#151412]">
          <div className="flex items-center justify-between border-b border-[rgba(21,20,18,0.16)] pb-3">
            <span className="tr-meta text-[#605A50]">Example pass</span>
            <span className="tr-meta text-[#605A50]">{current.slot}</span>
          </div>
          <p className="mt-6 font-display text-[34px] leading-[0.98] text-[#151412]">
            {current.sample}
          </p>
          <p className="mt-2 text-[14px] font-light text-[#605A50]">{current.venue}</p>
          <div className="mt-8 flex items-baseline justify-between border-t border-dashed border-[rgba(21,20,18,0.22)] pt-4">
            <span className="font-display text-[20px] text-[#151412]">{name}</span>
            <span className="tr-meta text-[#605A50]">Offline QR</span>
          </div>
        </div>
      </div>
    </section>
  );
}
