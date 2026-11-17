"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ATTEND_NAV, HOST_NAV, isActive, workspaceFor } from "./nav";

/** Phone tab bar for signed-in people. Shows the current workspace's main destinations. */
export function BottomNav() {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  if (ws === "admin") return null;

  const items =
    ws === "host"
      ? HOST_NAV
      : ATTEND_NAV.filter((n) => ["/dashboard", "/events", "/passes", "/vault", "/calendar"].includes(n.href));

  return (
    <nav aria-label="Tabs" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] print:hidden md:hidden">
      <ul className={cn("mx-auto grid max-w-md", ws === "host" ? "grid-cols-3" : "grid-cols-5")}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors duration-fast", active ? "text-ink" : "text-ink-subtle")}
              >
                <span className={cn("absolute top-0 h-[2px] w-6 rounded-full bg-ink transition-opacity duration-base", active ? "opacity-100" : "opacity-0")} aria-hidden />
                <Icon className="size-[20px]" strokeWidth={active ? 2.1 : 1.8} aria-hidden />
                {item.short ?? item.label}
              </Link>
            </li>
          );
        })}
        {ws === "host" && (
          <li>
            <Link href="/organizer/events/new" className="flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium text-ink">
              <span className="grid size-6 place-items-center rounded-full bg-ink text-white" aria-hidden>
                <Plus className="size-4" />
              </span>
              Create
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
