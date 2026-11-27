"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Download, ScanFace, ShieldCheck } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";

const FRAMES = [
  { id: "v0", frame: "EXP 01", accent: "orange", match: false },
  { id: "v1", frame: "EXP 02", accent: "violet", match: true },
  { id: "v2", frame: "EXP 03", accent: "teal", match: false },
  { id: "v3", frame: "EXP 04", accent: "pink", match: true },
  { id: "v4", frame: "EXP 05", accent: "blue", match: false },
  { id: "v5", frame: "EXP 06", accent: "green", match: true },
  { id: "v6", frame: "EXP 07", accent: "red", match: false },
  { id: "v7", frame: "EXP 08", accent: "violet", match: true },
  { id: "v8", frame: "EXP 09", accent: "orange", match: false },
] as const;

/**
 * Full-bleed Obsidian Darkroom Light-Table showcase for EvntCult's Photo Vault USP.
 * Photographers review contact sheets on dark tables; placing the vault here creates
 * dramatic architectural contrast against the warm cream paper sections.
 */
export function VaultSpotlight() {
  const [phase, setPhase] = useState<"idle" | "scanning" | "matched">("idle");

  const runMatch = () => {
    if (phase === "scanning") return;
    if (phase === "matched") {
      setPhase("idle");
      return;
    }
    setPhase("scanning");
    window.setTimeout(() => setPhase("matched"), 920);
  };

  return (
    <section
      aria-labelledby="vault-usp-h"
      className="bleed bg-night py-20 text-cream md:py-28"
    >
      <div className="mx-auto max-w-[1360px] px-gutter">
        <Reveal className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
          {/* Left editorial darkroom column */}
          <div>
            <h2
              id="vault-usp-h"
              className="font-display text-[clamp(44px,5.4vw,72px)] leading-[0.92] tracking-[-0.03em] text-cream"
            >
              One selfie at sign-in.{" "}
              <em className="text-lavender">Every photo you&apos;re in.</em>
            </h2>
            <p className="mt-6 max-w-[42ch] text-[16.5px] leading-relaxed text-cream/70">
              Skip digging through 500-photo Drive folders the morning after an event. Your browser
              converts one selfie into numbers on your device, discards the photo, and gathers
              every shot of you in your Photo Vault automatically.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-6 border-y border-white/12 py-5 text-[13.5px]">
              <div>
                <dt className="text-cream/75">Processing</dt>
                <dd className="mt-1 font-semibold text-cream">On your phone</dd>
              </div>
              <div>
                <dt className="text-cream/75">Selfie stored</dt>
                <dd className="mt-1 font-semibold text-cream">Never</dd>
              </div>
              <div>
                <dt className="text-cream/75">Delivery</dt>
                <dd className="mt-1 font-semibold text-cream">Full HD</dd>
              </div>
            </dl>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Magnetic>
                <Link
                  href="/signin?mode=signup"
                  className="ui-press ui-sheen inline-flex h-12 items-center gap-2 rounded-[14px] bg-lavender px-6 text-[15.5px] font-semibold text-[#1A1A1A] ring-2 ring-inset ring-cream hover:bg-lavender-hover"
                >
                  <ScanFace className="size-4" strokeWidth={2.1} aria-hidden />
                  Set up Photo Vault
                </Link>
              </Magnetic>
              <span className="inline-flex items-center gap-1.5 text-[13.5px] text-cream/80">
                <ShieldCheck className="size-4 text-[#5EE0A8]" aria-hidden />
                Clear Face ID anytime
              </span>
            </div>
          </div>

          {/* Right interactive darkroom contact sheet */}
          <div
            data-sample="true"
            className="rounded-[24px] bg-[#22211F] p-6 shadow-[0_32px_70px_-28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] md:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] text-cream/75">Example contact sheet</p>
                <p className="mt-0.5 text-[14.5px] font-medium text-cream" role="status">
                  {phase === "idle"
                    ? "9 frames from an event album"
                    : phase === "scanning"
                      ? "Matching 128-d face vector…"
                      : "4 photos of you matched"}
                </p>
              </div>
              <button
                type="button"
                onClick={runMatch}
                disabled={phase === "scanning"}
                className="ui-press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-lavender px-4 text-[13.5px] font-semibold text-[#1A1A1A] hover:bg-lavender-hover disabled:opacity-60"
              >
                {phase === "matched" ? "Show all" : phase === "scanning" ? "Scanning…" : "Try match"}
              </button>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-3 overflow-hidden rounded-2xl p-1">
              {FRAMES.map((item, idx) => {
                const isHit = phase === "matched" && item.match;
                const isDim = phase === "matched" && !item.match;
                return (
                  <m.div
                    key={item.id}
                    animate={{
                      scale: isDim ? 0.94 : 1,
                      opacity: isDim ? 0.2 : 1,
                    }}
                    transition={{ duration: 0.36, delay: phase === "matched" ? idx * 0.025 : 0 }}
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/10",
                      isHit && "ring-2 ring-lavender shadow-[0_12px_28px_-8px_rgba(0,0,0,0.75)]",
                    )}
                    aria-hidden
                  >
                    <EventArt accent={item.accent} seed={`vault-${item.id}`} scrim={false} flat />
                    <span className="absolute bottom-1.5 left-2 font-mono text-[9.5px] tracking-[0.06em] text-white/85">
                      {item.frame}
                    </span>
                    {isHit && (
                      <span className="paper-keep absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink shadow-sm">
                        <Check className="size-2.5 text-live" strokeWidth={3} />
                        Match
                      </span>
                    )}
                  </m.div>
                );
              })}

              {phase === "scanning" && (
                <span
                  aria-hidden
                  className="scanline pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-lavender/0 via-lavender/50 to-lavender/0"
                />
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[12.5px] text-cream/75">
              <span>Visible only to registered attendees</span>
              {phase === "matched" && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-lavender">
                  <Download className="size-3.5" aria-hidden />4 HD photos ready
                </span>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
