"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, ORGANIZER_NAV, isActive } from "./nav";

/** App-style bottom tabs on phones (District idea). */
export function MobileTabBar({ isOrganizer }: { isOrganizer: boolean }) {
  const pathname = usePathname();
  const base = NAV.filter((n) => ["/dashboard", "/events", "/passes", "/calendar"].includes(n.href));
  const items = [...base, isOrganizer ? ORGANIZER_NAV : NAV.find((n) => n.href === "/vault")!];

  return (
    <nav className="print:hidden fixed inset-x-3 bottom-3 z-40 rounded-full border border-white/10 bg-surface/80 px-2 py-1.5 shadow-pop backdrop-blur-xl md:hidden">
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
                <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", active && "bg-volt text-ink-inverse")}>
                  <Icon className="size-[18px]" />
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
