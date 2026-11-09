"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, KeyRound, LogOut, Plus, Search, Shapes } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { LogoWordmark } from "@/components/brand/MissingE";

export interface NavViewer {
  name: string;
  email: string;
  image?: string | null;
  isOrganizer: boolean;
}

/**
 * Top bar: one search box split into "What · When · Category" (Humanitix idea)
 * with a Ctrl+K shortcut (Devfolio idea), plus code, notifications and profile.
 */
export function TopBar({ viewer, onEnterCode }: { viewer: NavViewer | null; onEnterCode: () => void }) {
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/dashboard";
  }
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 print:hidden transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-canvas/85 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl" : "bg-canvas",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-3 px-4 lg:px-8">
        <Link href="/dashboard" className={cn("flex shrink-0 items-center gap-2.5", viewer && "md:hidden")} aria-label="EvntCult home">
          <LogoWordmark motion="type" className="text-[29px] text-ink" />
        </Link>

        {/* Search is for signed-in people only: visitors just see the landing page. */}
        {viewer && (
        <form action="/events" className="hidden h-12 min-w-0 flex-1 sm:flex items-center rounded-full border border-line bg-surface pl-4 pr-1.5 shadow-card transition-colors focus-within:border-volt/70 md:max-w-[640px]">
            <Search className="size-[18px] shrink-0 text-ink-subtle" />
            <input
              ref={inputRef}
              name="q"
              placeholder="Search events, clubs, venues…"
              className="min-w-0 flex-1 bg-transparent px-3 text-[14.5px] text-ink placeholder:text-ink-subtle focus:outline-none"
              aria-label="Search events"
            />
            <span className="hidden h-6 w-px bg-line lg:block" />
            <label className="hidden items-center gap-1.5 px-3 text-[13px] font-semibold text-ink-2 lg:flex">
              <CalendarDays className="size-4 text-ink-subtle" />
              <select name="when" className="cursor-pointer bg-transparent focus:outline-none" defaultValue="any" aria-label="When">
                <option value="any">Any day</option>
                <option value="today">Today</option>
                <option value="weekend">This weekend</option>
                <option value="week">This week</option>
              </select>
            </label>
            <span className="hidden h-6 w-px bg-line xl:block" />
            <label className="hidden items-center gap-1.5 px-3 text-[13px] font-semibold text-ink-2 xl:flex">
              <Shapes className="size-4 text-ink-subtle" />
              <select name="type" className="cursor-pointer bg-transparent focus:outline-none" defaultValue="all" aria-label="Category">
                <option value="all">All types</option>
                <option value="GAMING">Gaming</option>
                <option value="SPORTS">Sports</option>
                <option value="TECH">Tech</option>
                <option value="CULTURAL">Cultural</option>
                <option value="WORKSHOP">Workshops</option>
              </select>
            </label>
            <kbd className="mr-1 hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-subtle 2xl:block">Ctrl K</kbd>
            <button className="grid size-9 shrink-0 place-items-center rounded-full bg-volt text-ink-inverse transition-colors hover:bg-volt-hover" aria-label="Search">
              <Search className="size-4" />
            </button>
          </form>
        )}

        <div className="ml-auto flex items-center gap-2">
          {viewer ? (
            <>
              <Link href="/events" aria-label="Search events" className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 sm:hidden">
                <Search className="size-[18px]" />
              </Link>
              <Link
                href="/organizer/events/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-volt px-3.5 py-2.5 text-[13px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover md:hidden"
                >
                  <Plus className="size-4" /> Host
                </Link>
              <button
                onClick={onEnterCode}
                className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-ink-2 transition-colors hover:border-volt/60 sm:inline-flex"
              >
                <KeyRound className="size-4" /> Enter code
              </button>
              <Link
                href="/profile"
                className="grid size-10 place-items-center overflow-hidden rounded-full bg-volt sm:size-11 text-[13px] font-bold text-ink-inverse ring-2 ring-canvas"
                title={`${viewer.name} · ${viewer.email}`}
                aria-label={`Your profile (${viewer.name})`}
              >
                {initials(viewer.name)}
              </Link>
              <button
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:border-volt/60 sm:size-11"
              >
                <LogOut className="size-[18px]" />
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="rounded-full border border-line bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-volt/60">
                Log in
              </Link>
              <Link href="/signin?mode=signup" className="rounded-full bg-volt px-4 py-2.5 text-[13.5px] font-semibold text-ink-inverse transition-colors hover:bg-volt-hover">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
