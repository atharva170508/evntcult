"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";
import { NAV, ORGANIZER_NAV, isActive } from "./nav";

/** §6 sidebar: 240 wide, laptops only. The current page is marked by weight and an accent bar, not colour alone. */
export function Sidebar({ isOrganizer, signedIn, onEnterCode }: { isOrganizer: boolean; signedIn: boolean; onEnterCode: () => void }) {
  const pathname = usePathname();
  const items = isOrganizer ? [...NAV, ORGANIZER_NAV] : NAV;

  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line bg-surface px-4 py-4 print:!hidden lg:flex">
      <Link href="/dashboard" className="flex h-11 items-center px-2" aria-label="EvntCult home">
        <LogoWordmark className="text-title text-ink" />
      </Link>

      {signedIn && (
        <Link href="/organizer/events/new" className={buttonClass("secondary", "md", "mt-4 w-full")}>
          Host an event
        </Link>
      )}

      <nav className="mt-6 flex-1" aria-label="Main">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                {item === ORGANIZER_NAV && <p className="eyebrow mb-2 mt-6 px-3">Organize</p>}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center rounded-sm px-3 text-body transition-colors duration-micro",
                    active ? "bg-surface-2 font-semibold text-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-accent" : "text-ink-muted hover:bg-white/[0.03] hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {signedIn ? (
        <button type="button" onClick={onEnterCode} className={buttonClass("secondary", "md", "w-full")}>
          Enter an event code
        </button>
      ) : (
        <Link href="/signin?mode=signup" className={buttonClass("secondary", "md", "w-full")}>
          Sign up
        </Link>
      )}
    </aside>
  );
}
