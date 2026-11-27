"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ATTEND_NAV, VISITOR_HREF, isMainActive, workspaceFor } from "@/components/shell/nav";

/** Flush editorial mobile tab bar: 1px hairline border, ink ground, warm gold active state. */
export function TabBar({ signedIn = true }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  if (
    ws === "admin" ||
    /^\/events\/[^/]+$/.test(pathname) ||
    (!signedIn && pathname === "/dashboard")
  ) {
    return null;
  }

  const items = ATTEND_NAV;

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
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
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-[#D4B87A]" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="size-[19px]" strokeWidth={active ? 2 : 1.5} aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.05em]">
                  {item.short ?? item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
