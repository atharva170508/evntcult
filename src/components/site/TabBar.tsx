"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { ATTEND_NAV, VISITOR_HREF, isMainActive, workspaceFor } from "@/components/shell/nav";

/** Phone tab bar: unified Home · Discover · Calendar · Passes · Certs for all users & organizers. */
export function TabBar({ signedIn = true }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  // Admin has no tabs; an event's own page shows its price-and-register bar instead.
  if (ws === "admin" || /^\/events\/[^/]+$/.test(pathname)) return null;

  const items = ATTEND_NAV;

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 print:hidden supports-[not(backdrop-filter:blur(1px))]:bg-canvas md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active = isMainActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={!signedIn && VISITOR_HREF[item.href] ? VISITOR_HREF[item.href] : item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-fast active:opacity-70",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              >
                <span className="relative grid h-7 w-14 place-items-center">
                  {active && (
                    <m.span
                      layoutId="tab-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-lavender"
                      transition={{ type: "spring", stiffness: 520, damping: 42 }}
                    />
                  )}
                  <Icon className="relative size-[21px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden />
                </span>
                {item.short ?? item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
