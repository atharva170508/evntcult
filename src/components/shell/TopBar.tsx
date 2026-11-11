"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn, initials } from "@/lib/utils";
import { LogoMark, LogoWordmark } from "@/components/brand/MissingE";
import { NotificationBell } from "./NotificationBell";
import { buttonClass } from "@/components/ui/Button";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas print:hidden">
      <div className="mx-auto flex h-[52px] max-w-app items-center gap-2 px-4 sm:gap-3 lg:px-8">
        <Link href="/dashboard" className={cn("flex shrink-0 items-center gap-2", viewer && "lg:hidden")} aria-label="EvntCult home">
          <LogoMark className="size-8 text-ink" />
          <LogoWordmark className="hidden text-title text-ink min-[400px]:inline-block" />
        </Link>

        {/* Search is for signed-in people only: visitors just see the landing page. */}
        {viewer && (
        <form action="/events" className="hidden h-10 min-w-0 flex-1 sm:flex items-center rounded-sm border border-line bg-surface pl-3 pr-1 transition-colors focus-within:border-accent md:max-w-[640px]">
            
            <input
              ref={inputRef}
              name="q"
              placeholder="Search events, clubs, venues…"
              className="min-w-0 flex-1 bg-transparent px-3 text-body text-ink placeholder:text-ink-subtle"
              aria-label="Search events"
            />
            <span className="hidden h-6 w-px bg-line lg:block" />
            <label className="hidden items-center gap-2 px-3 text-label text-ink-muted lg:flex">
              <select name="when" className="cursor-pointer bg-transparent" defaultValue="any" aria-label="When">
                <option value="any">Any day</option>
                <option value="today">Today</option>
                <option value="weekend">This weekend</option>
                <option value="week">This week</option>
              </select>
            </label>
            <span className="hidden h-6 w-px bg-line xl:block" />
            <label className="hidden items-center gap-2 px-3 text-label text-ink-muted xl:flex">
              <select name="type" className="cursor-pointer bg-transparent" defaultValue="all" aria-label="Category">
                <option value="all">All types</option>
                <option value="GAMING">Gaming</option>
                <option value="SPORTS">Sports</option>
                <option value="TECH">Tech</option>
                <option value="CULTURAL">Cultural</option>
                <option value="WORKSHOP">Workshops</option>
              </select>
            </label>
            <kbd className="mr-1 hidden rounded-md border border-line px-2 py-1 font-mono text-caption text-ink-subtle 2xl:block">Ctrl K</kbd>
            <button className={buttonClass("ghost", "sm", "px-2")}>Search</button>
          </form>
        )}

        <div className="ml-auto flex items-center gap-2">
          {viewer ? (
            <>
              <NotificationBell />
              <Link
                href="/organizer/events/new"
                  className={buttonClass("secondary", "sm", "lg:hidden")}
                >
                   Host
                </Link>
              <button
                onClick={onEnterCode}
                className={buttonClass("secondary", "sm", "hidden sm:inline-flex")}
              >
                 Enter code
              </button>
              <Link
                href="/profile"
                className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong font-mono text-caption text-ink"
                title={`${viewer.name} · ${viewer.email}`}
                aria-label={`Your profile (${viewer.name})`}
              >
                {initials(viewer.name)}
              </Link>
              <button
                onClick={logout}
                className={buttonClass("ghost", "sm", "hidden px-2 sm:inline-flex")}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className={buttonClass("secondary", "sm")}>
                Log in
              </Link>
              <Link href="/signin?mode=signup" className={buttonClass("secondary", "sm")}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
