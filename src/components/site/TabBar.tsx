"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
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
                  "flex h-[62px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors duration-fast",
                  active ? "text-accent" : "text-ink-subtle",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden />
                {item.short ?? item.label}
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
