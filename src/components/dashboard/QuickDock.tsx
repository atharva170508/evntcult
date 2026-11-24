"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, CalendarDays, Images, KeyRound, MapPinned, Plus, Ticket, ArrowRight } from "lucide-react";

/**
 * Signed-in quick-action dock: gives logged-in users 1-tap access to every core surface
 * (Passes, Photo Vault, Certificates, Calendar, Venues, Host) plus an inline Event Code jumper.
 */
export function QuickDock({
  passCount,
  isOrganizer,
}: {
  passCount: number;
  isOrganizer: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim();
    if (!cleaned) return;
    router.push(`/events/${encodeURIComponent(cleaned.toLowerCase())}`);
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-y border-line py-3.5 lg:flex-row lg:items-center lg:justify-between">
      {/* 1-tap personal shortcuts */}
      <nav aria-label="Quick actions" className="flex flex-wrap items-center gap-2">
        <Link
          href="/passes"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-[#FFFEF6] transition-opacity hover:opacity-90"
        >
          <Ticket className="size-3.5" aria-hidden />
          My passes
          {passCount > 0 && (
            <span className="rounded-full bg-[#E3264F] px-1.5 py-0.5 font-mono text-[10.5px] leading-none text-white">
              {passCount}
            </span>
          )}
        </Link>

        <Link
          href="/vault"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
        >
          <Images className="size-3.5 text-ink-muted" aria-hidden />
          Photo Vault
        </Link>

        <Link
          href="/certificates"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
        >
          <Award className="size-3.5 text-ink-muted" aria-hidden />
          Certificates
        </Link>

        <Link
          href="/calendar"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
        >
          <CalendarDays className="size-3.5 text-ink-muted" aria-hidden />
          Calendar
        </Link>

        <Link
          href="/venues"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-sunken"
        >
          <MapPinned className="size-3.5 text-ink-muted" aria-hidden />
          Venues
        </Link>

        <Link
          href={isOrganizer ? "/organizer/events/new" : "/host"}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lavender px-3.5 text-[13px] font-semibold text-ink ring-1 ring-inset ring-ink/25 transition-colors hover:bg-lavender-hover"
        >
          <Plus className="size-3.5" strokeWidth={2.4} aria-hidden />
          {isOrganizer ? "Create event" : "Host event"}
        </Link>
      </nav>

      {/* Inline Event Code quick-jump */}
      <form onSubmit={submitCode} className="flex items-center gap-1.5">
        <label htmlFor="dash-event-code" className="sr-only">
          Enter event code or slug
        </label>
        <div className="relative flex items-center">
          <KeyRound className="pointer-events-none absolute left-3 size-3.5 text-ink-muted" aria-hidden />
          <input
            id="dash-event-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Have an event code?"
            className="h-9 w-full rounded-full border border-line-strong bg-surface pl-8 pr-3 text-[13px] font-medium text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none sm:w-[195px]"
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim()}
          aria-label="Open event"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-[#FFFEF6] transition-opacity hover:opacity-90 disabled:opacity-35"
        >
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
