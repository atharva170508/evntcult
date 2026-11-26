"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Images, KeyRound, LayoutGrid, MapPinned, Plus } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { COUT } from "@/lib/motion-curves";

/**
 * Signed-in action bar: surfaces only the high-value tools NOT already sitting in the top header
 * (inline Event Code jumper, Photo Vault, Venues & Directions, and Create/Host event).
 */
export function QuickDock({
  isOrganizer,
}: {
  passCount?: number;
  isOrganizer: boolean;
}) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const [code, setCode] = useState("");

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (!cleaned) return;
    router.push(`/c/${encodeURIComponent(cleaned.toLowerCase())}`);
  };

  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, duration: 0.45, ease: COUT }}
      className="mt-5 flex flex-col gap-3 border-y border-line py-3.5 md:flex-row md:items-center md:justify-between"
    >
      {/* Inline Event Code quick-jump */}
      <form onSubmit={submitCode} className="flex items-center gap-1.5">
        <label htmlFor="dash-event-code" className="sr-only">
          Enter event code
        </label>
        <div className="relative flex flex-1 items-center md:flex-initial">
          <KeyRound className="pointer-events-none absolute left-3.5 size-3.5 text-ink-muted" aria-hidden />
          <input
            id="dash-event-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Have an event code?"
            className="h-9 w-full rounded-full border border-line-strong bg-surface/85 pl-9 pr-3.5 text-[13px] font-medium text-ink backdrop-blur-md placeholder:text-ink-subtle focus:border-ink focus:outline-none dark:border-white/12 dark:bg-[#1A1816]/80 md:w-[220px]"
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim()}
          aria-label="Open event by code"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12.5px] font-semibold text-[#FFFEF6] transition-opacity hover:opacity-90 disabled:opacity-35"
        >
          <span>Join</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </form>

      {/* Focused non-redundant campus tools */}
      <nav aria-label="Quick tools" className="flex flex-wrap items-center gap-2">
        <Link
          href="/vault"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface/85 px-3.5 text-[13px] font-semibold text-ink backdrop-blur-md transition-colors hover:bg-sunken dark:border-white/12 dark:bg-[#1A1816]/75 dark:hover:bg-white/[0.08]"
        >
          <Images className="size-3.5 text-ink-muted" aria-hidden />
          Photo Vault
        </Link>

        <Link
          href="/venues"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface/85 px-3.5 text-[13px] font-semibold text-ink backdrop-blur-md transition-colors hover:bg-sunken dark:border-white/12 dark:bg-[#1A1816]/75 dark:hover:bg-white/[0.08]"
        >
          <MapPinned className="size-3.5 text-ink-muted" aria-hidden />
          Venues
        </Link>

        {isOrganizer && (
          <Link
            href="/organizer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface/85 px-3.5 text-[13px] font-semibold text-ink backdrop-blur-md transition-colors hover:bg-sunken dark:border-white/12 dark:bg-[#1A1816]/75 dark:hover:bg-white/[0.08]"
          >
            <LayoutGrid className="size-3.5 text-ink-muted" aria-hidden />
            My hosted events
          </Link>
        )}

        {/* Organizers host; everyone else can only apply (hosting is verified by Synchronous Labs). */}
        {!isOrganizer ? (
          <Link
            href="/host"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface/85 px-3.5 text-[13px] font-semibold text-ink backdrop-blur-md transition-colors hover:bg-sunken dark:border-white/12 dark:bg-[#1A1816]/75 dark:hover:bg-white/[0.08]"
          >
            <BadgeCheck className="size-3.5 text-ink-muted" aria-hidden />
            Apply to host
          </Link>
        ) : (
        <Link
          href="/organizer/events/new"
          className="relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full bg-lavender px-3.5 text-[13px] font-semibold text-[#121110] ring-1 ring-inset ring-ink/25 transition-colors hover:bg-lavender-hover dark:ring-white/25"
        >
          {!reduced && (
            <BorderTrail
              size={34}
              className="bg-gradient-to-l from-[#E3264F] via-[#1A1A1A] to-transparent opacity-65"
              transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
            />
          )}
          <Plus className="relative z-10 size-3.5" strokeWidth={2.4} aria-hidden />
          <span className="relative z-10">Host an Event</span>
        </Link>
        )}
      </nav>
    </m.div>
  );
}
