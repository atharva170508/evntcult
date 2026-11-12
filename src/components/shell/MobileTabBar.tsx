"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, VISITOR_HREF, isActive } from "./nav";

/** §6 phone bar: 48 tall plus the safe area, the same five pages as the top menu, words only. */
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden">
      <ul className="grid h-12 grid-cols-5">
        {NAV.map((item) => {
          const href = signedIn ? item.href : (VISITOR_HREF[item.href] ?? item.href);
          const active = signedIn ? isActive(pathname, item.href) : href === "/" && pathname === "/";
          return (
            <li key={item.href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-1 items-center justify-center border-t-2 text-label", active ? "border-accent font-semibold text-ink" : "border-transparent text-ink-muted")}
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
