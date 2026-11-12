"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { LogoMark, LogoWordmark } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { NotificationBell } from "./NotificationBell";
import { MORE, NAV, VISITOR_HREF, isActive } from "./nav";

export interface NavViewer {
  name: string;
  email: string;
  image?: string | null;
  isOrganizer: boolean;
}

/**
 * The one bar at the top of every app page. Laptops: logo, the five main pages, search, updates, you.
 * Phones: logo, updates, you (the five pages sit in the bottom bar). The current page is underlined
 * and heavier, so colour is never the only signal.
 */
export function TopBar({ viewer, onEnterCode }: { viewer: NavViewer | null; onEnterCode: () => void }) {
  const pathname = usePathname();
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas print:hidden">
      <div className="mx-auto flex h-[52px] max-w-app items-center gap-6 px-4 lg:px-8">
        <Link href={viewer ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2" aria-label="EvntCult home">
          <LogoMark className="size-8 text-ink" />
          <LogoWordmark className="hidden text-title text-ink min-[400px]:inline-block" />
        </Link>

        <nav aria-label="Main" className="hidden h-full lg:block">
          <ul className="flex h-full items-stretch gap-6">
            {NAV.map((item) => {
              const href = viewer ? item.href : (VISITOR_HREF[item.href] ?? item.href);
              const active = viewer ? isActive(pathname, item.href) : href === "/" && pathname === "/";
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-mb-px flex items-center border-b-2 text-body transition-colors duration-micro",
                      active ? "border-accent font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {viewer ? (
            <>
              <form action="/events" role="search" className="hidden xl:block">
                <label htmlFor="top-search" className="sr-only">
                  Search events
                </label>
                <input
                  id="top-search"
                  name="q"
                  placeholder="Search events"
                  className="h-8 w-48 rounded-sm border border-line bg-surface px-3 text-body-sm text-ink placeholder:text-ink-subtle"
                />
              </form>
              <NotificationBell />
              <Menu
                align="end"
                triggerClassName="press flex h-8 items-center gap-1 rounded-full border border-line-strong pl-1 pr-2 font-mono text-caption text-ink hover:border-ink-subtle"
                label={
                  <>
                    <span className="grid size-6 place-items-center" aria-hidden>
                      {initials(viewer.name)}
                    </span>
                    <span className="sr-only">Your account ({viewer.name})</span>
                  </>
                }
                items={[
                  ...MORE.map((m) => ({ label: m.label, href: m.href })),
                  viewer.isOrganizer ? { label: "Organizer workspace", href: "/organizer" } : { label: "Apply to host events", href: "/host" },
                  { label: "Enter an event code", onSelect: onEnterCode },
                  { label: "Log out", onSelect: logout },
                ]}
              />
            </>
          ) : (
            <>
              <Link href="/signin" className={buttonClass("ghost", "sm")}>
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
