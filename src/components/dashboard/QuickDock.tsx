"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

/** Seamless minimal utility bar for signed-in users. */
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
          placeholder="Event code"
          className="h-11 w-full rounded-[4px] border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-ink-muted focus:border-[#D4B87A] focus:outline-none md:w-[200px]"
        />
        <button
          type="submit"
          disabled={!code.trim()}
          aria-label="Open event by code"
          className="inline-flex h-11 items-center gap-1.5 rounded-[4px] bg-[#D4B87A] px-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:bg-[#E0C78E] disabled:opacity-35"
        >
          <span>Join</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </form>

      <nav aria-label="Quick tools" className="flex flex-wrap items-center gap-x-7 gap-y-2">
        <Link href="/vault" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink">
          Photo Vault
        </Link>
        <Link href="/venues" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink">
          Venues
        </Link>
        {isOrganizer ? (
          <>
            <Link href="/organizer" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-ink-muted hover:text-ink">
              Hosted
            </Link>
            <Link href="/organizer/events/new" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#D4B87A]">
              Create event
            </Link>
          </>
        ) : (
          <Link href="/host" className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#D4B87A]">
            Host an event
          </Link>
        )}
      </nav>
    </div>
  );
}
