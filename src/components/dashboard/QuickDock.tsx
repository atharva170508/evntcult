"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

/** Hairline utility strip for signed-in users: event code jump + quiet mono links. */
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
    <div className="mt-8 flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
      <form onSubmit={submitCode} className="flex items-center gap-2">
        <label htmlFor="dash-event-code" className="sr-only">
          Enter event code
        </label>
        <input
          id="dash-event-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter event code"
          className="h-11 w-full rounded-[8px] border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-ink-muted focus:border-[#C9A26B] focus:outline-none md:w-[220px]"
        />
        <button
          type="submit"
          disabled={!code.trim()}
          aria-label="Open event by code"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#C9A26B] px-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412] transition-colors hover:bg-[#D7B47F] disabled:opacity-35"
        >
          <span>Join</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </form>

      <nav aria-label="Quick tools" className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/vault" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink">
          Photo Vault
        </Link>
        <Link href="/venues" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink">
          Venues
        </Link>
        {isOrganizer ? (
          <>
            <Link href="/organizer" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink">
              Hosted events
            </Link>
            <Link href="/organizer/events/new" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#C9A26B]">
              Create event
            </Link>
          </>
        ) : (
          <Link href="/host" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#C9A26B]">
            Apply to host
          </Link>
        )}
      </nav>
    </div>
  );
}
