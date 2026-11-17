"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Images, Plus, Search, Ticket, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOST_NAV, isActive, workspaceFor } from "@/components/shell/nav";

const ATTEND_TABS = [
  { href: "/dashboard", label: "Explore", icon: Search },
  { href: "/passes", label: "Passes", icon: Ticket },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/vault", label: "Photos", icon: Images },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Phone tab bar for signed-in people: the current workspace's main destinations. */
export function TabBar() {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  // Admin has no tabs; an event's own page shows its price-and-register bar instead.
  if (ws === "admin" || /^\/events\/[^/]+$/.test(pathname)) return null;

  const items = ws === "host" ? HOST_NAV : ATTEND_TABS;

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
    >
      <ul className={cn("mx-auto grid max-w-md", ws === "host" ? "grid-cols-3" : "grid-cols-5")}>
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" || pathname.startsWith("/events") : isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors duration-fast",
                  active ? "text-accent" : "text-ink-subtle",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        {ws === "host" && (
          <li>
            <Link href="/organizer/events/new" className="flex h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-ink">
              <span className="grid size-7 place-items-center rounded-full bg-accent text-white" aria-hidden>
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
