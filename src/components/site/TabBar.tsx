"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { ATTEND_NAV, VISITOR_HREF, isMainActive, workspaceFor } from "@/components/shell/nav";

/* Platform shapes, keyed off data-platform on <html> (set before paint):
   - iOS and others: a floating liquid-glass capsule above the home indicator, like an iOS tab bar.
   - Android: a flush, full-width glass bar with a pill behind the active icon, like Material 3. */

/** Phone tab bar: the same Home · Discover · Calendar · Passes · Certs for everyone, organizers included. */
export function TabBar({ signedIn = true }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  // Admin has no tabs; an event's own page shows its price-and-register bar instead.
  if (ws === "admin" || /^\/events\/[^/]+$/.test(pathname)) return null;

  const items = ATTEND_NAV;

  return (
    <nav
      aria-label="Tabs"
      className={cn(
        "fixed z-40 print:hidden md:hidden",
        // iOS: floating capsule, clear of the home indicator and the screen's rounded corners.
        "inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)]",
        // Android: flush to the edges and the bottom, padded for the gesture bar.
        "[[data-platform=android]_&]:inset-x-0 [[data-platform=android]_&]:bottom-0 [[data-platform=android]_&]:pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul
        className={cn(
          "liquid-glass mx-auto grid max-w-md grid-cols-5 rounded-[28px] px-1.5 py-1",
          "[[data-platform=android]_&]:max-w-none [[data-platform=android]_&]:rounded-none [[data-platform=android]_&]:px-0 [[data-platform=android]_&]:py-0",
        )}
      >
        {items.map((item) => {
          const active = isMainActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={!signedIn && VISITOR_HREF[item.href] ? VISITOR_HREF[item.href] : item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-[58px] flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10.5px] font-semibold tracking-[0.01em] transition-[color,transform] duration-fast active:scale-[0.94]",
                  "[[data-platform=android]_&]:h-[72px] [[data-platform=android]_&]:gap-1 [[data-platform=android]_&]:rounded-none [[data-platform=android]_&]:text-[12px] [[data-platform=android]_&]:active:scale-100",
                  // On the lavender pill, text stays dark in both themes (light ink on lavender is unreadable).
                  active ? "text-night [[data-platform=android]_&]:text-ink" : "text-ink-muted",
                )}
              >
                {/* iOS: a soft glass lozenge behind the whole active tab. */}
                {active && (
                  <m.span
                    layoutId="tab-glass"
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0.5 inset-y-1 rounded-[20px] bg-lavender/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]",
                      "[[data-platform=android]_&]:hidden",
                    )}
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                  />
                )}
                <span className={cn("relative grid h-7 w-12 place-items-center", "[[data-platform=android]_&]:h-8 [[data-platform=android]_&]:w-16")}>
                  {/* Android: Material's pill behind the active icon only. */}
                  {active && <span aria-hidden className={cn("absolute inset-0 hidden rounded-full bg-lavender", "[[data-platform=android]_&]:block")} />}
                  <Icon className={cn("relative size-[22px]", active && "text-night")} strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                </span>
                <span className="relative">{item.short ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
