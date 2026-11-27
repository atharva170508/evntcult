"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Images, KeyRound, LayoutGrid, MapPinned, Plus } from "lucide-react";

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
  const [code, setCode] = useState("");

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (!cleaned) return;
    router.push(`/c/${encodeURIComponent(cleaned.toLowerCase())}`);
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-y border-line py-3.5 md:flex-row md:items-center md:justify-between">
      <form onSubmit={submitCode} className="flex items-center gap-2">
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
            className="h-11 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3.5 text-[13.5px] font-medium text-ink placeholder:text-ink-subtle focus:border-ink focus-visible:shadow-[var(--focus-field)] sm:h-10 md:w-[230px]"
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim()}
          aria-label="Open event by code"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-35 sm:h-10"
        >
          <span>Join</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </form>

      <nav aria-label="Quick tools" className="flex flex-wrap items-center gap-2">
        <Link
          href="/vault"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink hover:bg-sunken sm:min-h-[38px]"
        >
          <Images className="size-3.5 text-ink-muted" aria-hidden />
          Photo Vault
        </Link>

        <Link
          href="/venues"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink hover:bg-sunken sm:min-h-[38px]"
        >
          <MapPinned className="size-3.5 text-ink-muted" aria-hidden />
          Venues
        </Link>

        {isOrganizer && (
          <Link
            href="/organizer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink hover:bg-sunken sm:min-h-[38px]"
          >
            <LayoutGrid className="size-3.5 text-ink-muted" aria-hidden />
            My hosted events
          </Link>
        )}

        {!isOrganizer ? (
          <Link
            href="/host"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink hover:bg-sunken sm:min-h-[38px]"
          >
            <BadgeCheck className="size-3.5 text-ink-muted" aria-hidden />
            Apply to host
          </Link>
        ) : (
        <Link
          href="/organizer/events/new"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-lavender px-4 text-[13px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover sm:min-h-[38px]"
        >
          <Plus className="size-3.5" strokeWidth={2.4} aria-hidden />
          Host an Event
        </Link>
        )}
      </nav>
    </div>
  );
}
