"use client";

import { useState } from "react";
import Link from "next/link";
import { Odometer } from "@/components/ui/Odometer";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";

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
 * Stripe-inspired interactive 0% UPI platform fee calculator for student organizers.
 * Real arithmetic: compares EvntCult's 0% direct UPI against a standard 5% ticketing fee.
 */
export function SavingsCalculator() {
  const [price, setPrice] = useState(250);
  const [guests, setGuests] = useState(200);

  const gross = price * guests;
  const typicalFee = Math.round(gross * 0.05);

  return (
    <Reveal as="section" aria-labelledby="calc-h" className="py-12 md:py-20">
      <div className="overflow-hidden rounded-[24px] bg-surface shadow-card">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: sliders */}
          <div className="p-8 md:p-12">
            <h2
              id="calc-h"
              className="font-display text-[clamp(38px,4.6vw,58px)] leading-[0.95] tracking-[-0.03em] text-ink"
            >
              Keep every rupee <em>your club earns.</em>
            </h2>
            <p className="mt-4 max-w-[44ch] text-[15.5px] leading-relaxed text-ink-2">
              Paid tickets go straight to your club&apos;s UPI ID with zero middleman cut. Slide
              your numbers to see what a typical 5% ticketing fee would take.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="calc-price" className="text-[14px] font-semibold text-ink">
                    Ticket price
                  </label>
                  <span className="font-mono text-[16px] font-semibold tabular-nums text-ink">
                    ₹{inr.format(price)}
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
                  className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-mist accent-[#1A1A1A]"
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-subtle">
                  <span>₹50</span>
                  <span>₹2,000</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="calc-guests" className="text-[14px] font-semibold text-ink">
                    Paid attendees
                  </label>
                  <span className="font-mono text-[16px] font-semibold tabular-nums text-ink">
                    {inr.format(guests)}
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
                  className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-mist accent-[#1A1A1A]"
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-subtle">
                  <span>20</span>
                  <span>1,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: live breakdown */}
          <div className="flex flex-col justify-between border-t border-line bg-sunken/60 p-8 md:p-12 lg:border-l lg:border-t-0">
            <div>
              <p className="text-[13px] font-medium text-ink-muted">Club keeps on EvntCult</p>
              <p className="mt-2 font-display text-[clamp(48px,6vw,72px)] leading-none tracking-[-0.03em] text-ink">
                ₹<Odometer value={gross} />
              </p>

              <dl className="mt-7 divide-y divide-line border-y border-line text-[14.5px]">
                <div className="flex items-center justify-between py-3">
                  <dt className="text-ink-muted">EvntCult platform fee</dt>
                  <dd className="font-mono font-semibold text-live">₹0 (0%)</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-ink-muted">Typical 5% ticketing platform</dt>
                  <dd className="font-mono font-medium text-ink-2 tabular-nums">
                    − ₹{inr.format(typicalFee)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="font-semibold text-ink">Saved for your event budget</dt>
                  <dd className="font-mono font-semibold text-ink tabular-nums">
                    ₹{inr.format(typicalFee)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[13px] font-medium text-ink-2">
                {campusEquivalent(typicalFee)}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Magnetic>
                <Link
                  href="/host"
                  className="ui-press ui-sheen inline-flex h-12 items-center rounded-[14px] bg-lavender px-6 text-[15.5px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink hover:bg-lavender-hover"
                >
                  Apply to host free
                </Link>
              </Magnetic>
              <span className="text-[13px] text-ink-muted">Direct UPI · Instant UTR list</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
