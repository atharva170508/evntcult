"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ATTEND_NAV, HOST_NAV, isActive, workspaceFor } from "@/components/shell/nav";

const ATTEND_TABS = ["/dashboard", "/events", "/passes", "/vault", "/calendar"];

/** Phone tab bar for signed-in people: the current workspace's main destinations. */
export function TabBar() {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  if (ws === "admin") return null;

  const items = ws === "host" ? HOST_NAV : ATTEND_TABS.map((h) => ATTEND_NAV.find((n) => n.href === h)!);

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl print:hidden md:hidden"
    >
      <ul className={cn("mx-auto grid max-w-md", ws === "host" ? "grid-cols-3" : "grid-cols-5")}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-fast",
                  active ? "text-night" : "text-ink-subtle",
                )}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors duration-base", active && "bg-sunken")}>
                  <Icon className="size-[19px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                </span>
                {item.short ?? (item.href === "/dashboard" ? "Home" : item.label)}
              </Link>
            </li>
          );
        })}
        {ws === "host" && (
          <li>
            <Link href="/organizer/events/new" className="flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink">
              <span className="grid h-7 w-12 place-items-center rounded-full bg-accent text-white" aria-hidden>
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
