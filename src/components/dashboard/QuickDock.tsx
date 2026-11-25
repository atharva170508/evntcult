"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Images, KeyRound, LayoutGrid, MapPinned, Plus } from "lucide-react";

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
            className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3.5 text-[13px] font-medium text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none md:w-[220px]"
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
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
        >
          <Images className="size-3.5 text-ink-muted" aria-hidden />
          Photo Vault
        </Link>

        <Link
          href="/venues"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
        >
          <MapPinned className="size-3.5 text-ink-muted" aria-hidden />
          Venues
        </Link>

        {isOrganizer && (
          <Link
            href="/organizer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
          >
            <LayoutGrid className="size-3.5 text-ink-muted" aria-hidden />
            My hosted events
          </Link>
        )}

        <Link
          href={isOrganizer ? "/organizer/events/new" : "/host"}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lavender px-3.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-ink/25 transition-colors hover:bg-lavender-hover"
        >
          <Plus className="size-3.5" strokeWidth={2.4} aria-hidden />
          {isOrganizer ? "Host an Event" : "Host event"}
        </Link>
      </nav>
    </div>
  );
}
