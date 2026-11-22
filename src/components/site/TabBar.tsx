"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { ATTEND_NAV, HOST_NAV, VISITOR_HREF, isActive, isMainActive, workspaceFor } from "@/components/shell/nav";

/** Phone tab bar: Home · Discover · Calendar · Passes · Certs (or the hosting tabs). Visitors get it too. */
export function TabBar({ signedIn = true }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  // Admin has no tabs; an event's own page shows its price-and-register bar instead.
  if (ws === "admin" || /^\/events\/[^/]+$/.test(pathname)) return null;

  const items = ws === "host" ? HOST_NAV : ATTEND_NAV;

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 print:hidden supports-[not(backdrop-filter:blur(1px))]:bg-canvas md:hidden"
    >
      <ul className={cn("mx-auto grid max-w-md", ws === "host" ? "grid-cols-3" : "grid-cols-5")}>
        {items.map((item) => {
          const active = ws === "host" ? isActive(pathname, item) : isMainActive(pathname, item.href);
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
        {ws === "host" && (
          <li>
            <Link href="/organizer/events/new" className="flex h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink active:opacity-70">
              <span className="grid h-7 w-14 place-items-center rounded-full bg-ink text-white" aria-hidden>
                <Plus className="size-[18px]" />
              </span>
              Create
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
