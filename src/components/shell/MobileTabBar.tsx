"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, ORGANIZER_NAV, isActive } from "./nav";

/** §6 phone bar: 48 tall plus the safe area, words only. The current tab is underlined and heavier. */
export function MobileTabBar({ isOrganizer }: { isOrganizer: boolean }) {
  const pathname = usePathname();
  const base = NAV.filter((n) => ["/dashboard", "/events", "/passes", "/calendar"].includes(n.href));
  const items = [...base, isOrganizer ? ORGANIZER_NAV : NAV.find((n) => n.href === "/vault")!];

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden">
      <ul className="grid h-12 grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center justify-center border-t-2 text-label",
                  active ? "border-accent font-semibold text-ink" : "border-transparent text-ink-muted",
                )}
              >
                {item.short ?? item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
