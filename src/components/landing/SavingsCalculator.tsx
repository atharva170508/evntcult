"use client";

import { useState } from "react";
import Link from "next/link";
import { Magnetic } from "@/components/motion/Magnetic";
import { InView } from "@/components/shadcn/in-view";
import { SlidingNumber } from "@/components/shadcn/sliding-number";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { COUT } from "@/lib/motion-curves";

const inr = new Intl.NumberFormat("en-IN");

function campusEquivalent(saved: number): string {
  if (saved < 500) {
    const chais = Math.max(1, Math.round(saved / 15));
    return `Roughly ${inr.format(chais)} cutting chais saved`;
  }
  if (saved < 3000) {
    const samosas = Math.round(saved / 30);
    return `Roughly ${inr.format(samosas)} plates of canteen samosas saved`;
  }
  if (saved < 15000) {
    const pizzas = Math.round(saved / 450);
    return `Roughly ${inr.format(pizzas)} boxes of 2 AM hackathon pizza`;
  }
  if (saved < 50000) {
    return "Basically pays for the campus DJ and sound rig";
  }
  return "That's a whole fest headliner budget right there";
}

/**
 * Dark Obsidian 0% UPI platform fee calculator with SlidingNumber odometers.
 */
export function SavingsCalculator() {
  const [price, setPrice] = useState(250);
  const [guests, setGuests] = useState(200);

  const gross = price * guests;
  const typicalFee = Math.round(gross * 0.05);

  return (
    <section aria-labelledby="calc-h" className="w-full border-t border-white/10 bg-[#121110] py-16 text-[#EDE3DA] md:py-24">
      <div className="mx-auto max-w-[1360px] px-gutter">
        <InView
          once
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.7, ease: COUT }}
          className="relative overflow-hidden rounded-[24px] border border-white/12 bg-[#1A1816] shadow-[0_32px_70px_-28px_rgba(0,0,0,0.85)]"
        >
          <BorderTrail
            size={90}
            className="bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent opacity-55"
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          />
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: sliders */}
            <div className="p-8 md:p-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#F0D7FF]/80">
                04 · Zero Commission
              </p>
              <h2
                id="calc-h"
                className="mt-3 font-display text-[clamp(38px,4.6vw,58px)] leading-[0.95] tracking-[-0.03em] text-[#EDE3DA]"
              >
                Keep every rupee <em className="italic text-[#F0D7FF]">your club earns.</em>
              </h2>
              <p className="mt-4 max-w-[44ch] text-[15.5px] leading-relaxed text-[#EDE3DA]/70">
                Paid tickets go straight to your club&apos;s UPI ID with zero middleman cut. Slide
                your numbers to see what a typical 5% ticketing fee would take.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="calc-price" className="text-[14px] font-semibold text-[#EDE3DA]">
                      Ticket price
                    </label>
                    <span className="font-mono text-[16px] font-semibold tabular-nums text-[#F0D7FF]">
                      ₹<SlidingNumber value={price} />
                    </span>
                  </div>
                  <input
                    id="calc-price"
                    type="range"
                    min={50}
                    max={2000}
                    step={50}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#F0D7FF]"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[11px] text-[#EDE3DA]/45">
                    <span>₹50</span>
                    <span>₹2,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="calc-guests" className="text-[14px] font-semibold text-[#EDE3DA]">
                      Paid attendees
                    </label>
                    <span className="font-mono text-[16px] font-semibold tabular-nums text-[#F0D7FF]">
                      <SlidingNumber value={guests} />
                    </span>
                  </div>
                  <input
                    id="calc-guests"
                    type="range"
                    min={20}
                    max={1000}
                    step={20}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#F0D7FF]"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[11px] text-[#EDE3DA]/45">
                    <span>20</span>
                    <span>1,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: live breakdown */}
            <div className="flex flex-col justify-between border-t border-white/10 bg-[#141312] p-8 md:p-12 lg:border-l lg:border-t-0">
              <div>
                <p className="text-[13px] font-medium text-[#EDE3DA]/55">Club keeps on EvntCult</p>
                <p className="mt-2 flex items-baseline font-display text-[clamp(44px,5.6vw,68px)] leading-none tracking-[-0.03em] text-[#EDE3DA]">
                  <span>₹</span>
                  <SlidingNumber value={gross} />
                </p>

                <dl className="mt-7 divide-y divide-white/10 border-y border-white/10 text-[14.5px]">
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-[#EDE3DA]/60">EvntCult platform fee</dt>
                    <dd className="font-mono font-semibold text-[#5EE0A8]">₹0 (0%)</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-[#EDE3DA]/60">Typical 5% ticketing platform</dt>
                    <dd className="font-mono font-medium text-[#EDE3DA]/75 tabular-nums">
                      − ₹<SlidingNumber value={typicalFee} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="font-semibold text-[#EDE3DA]">Saved for your event budget</dt>
                    <dd className="font-mono font-semibold text-[#F0D7FF] tabular-nums">
                      ₹<SlidingNumber value={typicalFee} />
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[13px] font-medium text-[#EDE3DA]/70">
                  {campusEquivalent(typicalFee)}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Magnetic>
                  <Link
                    href="/host"
                    className="ui-press ui-sheen inline-flex h-12 items-center rounded-[14px] bg-[#F0D7FF] px-6 text-[15.5px] font-semibold text-[#121110] transition-colors hover:bg-white"
                  >
                    Apply to host free
                  </Link>
                </Magnetic>
                <span className="text-[13px] text-[#EDE3DA]/55">Direct UPI · Instant UTR list</span>
              </div>
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}
