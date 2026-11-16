"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, ORGANIZER_NAV, isActive } from "./nav";

/** Phone bottom tabs for signed-in people: five destinations, 56px targets, ink indicator. */
export function MobileTabBar({ isOrganizer }: { isOrganizer: boolean }) {
  const pathname = usePathname();
  const base = NAV.filter((n) => ["/dashboard", "/events", "/passes", "/calendar"].includes(n.href));
  const items = [...base, isOrganizer ? ORGANIZER_NAV : NAV.find((n) => n.href === "/vault")!];

  return (
    <nav
      aria-label="Tabs"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors duration-fast",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              >
                <span className={cn("absolute top-0 h-[2px] w-6 rounded-full bg-ink transition-opacity duration-base", active ? "opacity-100" : "opacity-0")} aria-hidden />
                <Icon className="size-[20px]" strokeWidth={active ? 2.1 : 1.8} aria-hidden />
                {item.label.replace("My passes", "Passes").replace("Photo Vault", "Vault")}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
