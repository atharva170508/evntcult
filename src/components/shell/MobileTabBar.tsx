"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { NAV, ORGANIZER_NAV, isActive } from "./nav";

/** App-style bottom tabs on phones (District idea). */
export function MobileTabBar({ isOrganizer }: { isOrganizer: boolean }) {
  const pathname = usePathname();
  const base = NAV.filter((n) => ["/dashboard", "/events", "/passes", "/calendar"].includes(n.href));
  const items = [...base, isOrganizer ? ORGANIZER_NAV : NAV.find((n) => n.href === "/vault")!];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[26px] border border-line bg-surface/95 px-2 py-1.5 shadow-pop backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              >
                <span className={cn("relative grid h-8 w-12 place-items-center rounded-full transition-colors", active && "text-ink-contrast")}>
                  {active && <motion.span layoutId="tab-active" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
                  <Icon className="relative size-[18px]" />
                </span>
                {item.label.replace("My passes", "Passes")}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
