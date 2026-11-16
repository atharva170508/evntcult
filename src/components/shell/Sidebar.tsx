"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoIcon, LogoWordmark } from "@/components/brand/MissingE";
import { NAV, NAV_GROUPS, ORGANIZER_NAV, isActive, type NavItem } from "./nav";

/**
 * Laptop app menu. 72px icon rail on md/lg, 248px labelled menu on xl.
 * Active item: white chip with a hairline (Linear-style), never a colour fill.
 */
export function Sidebar({ isOrganizer, onEnterCode }: { isOrganizer: boolean; signedIn?: boolean; onEnterCode: () => void }) {
  const pathname = usePathname();
  const byHref = new Map(NAV.map((n) => [n.href, n]));

  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-line bg-canvas px-3 py-4 print:!hidden md:flex xl:w-[248px] xl:px-4">
      <Link href="/dashboard" className="flex h-10 items-center justify-center rounded-xl xl:justify-start xl:px-2" aria-label="EvntCult home">
        <LogoIcon className="size-8 xl:hidden" />
        <LogoWordmark motion="blink" className="hidden text-[26px] text-ink xl:inline-block" />
      </Link>

      {isOrganizer && (
        <Link
          href="/organizer/events/new"
          title="Create event"
          className="mt-5 flex h-10 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-white shadow-button transition-[background-color,transform] duration-fast ease-out hover:bg-[#2a2a28] active:scale-[0.98]"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden xl:inline">Create event</span>
        </Link>
      )}

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto no-scrollbar" aria-label="Main">
        {NAV_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="eyebrow mb-1.5 hidden px-2.5 xl:block">{g.label}</p>
            <ul className="space-y-0.5">
              {g.hrefs.map((h) => {
                const item = byHref.get(h);
                return item ? <SideLink key={h} item={item} active={isActive(pathname, h)} /> : null;
              })}
            </ul>
          </div>
        ))}
        {isOrganizer && (
          <div>
            <p className="eyebrow mb-1.5 hidden px-2.5 xl:block">Organize</p>
            <ul>
              <SideLink item={ORGANIZER_NAV} active={isActive(pathname, ORGANIZER_NAV.href)} />
            </ul>
          </div>
        )}
      </nav>

      <button
        onClick={onEnterCode}
        className="group hidden w-full rounded-card bg-surface p-4 text-left shadow-card transition-[box-shadow,transform] duration-base ease-out hover:-translate-y-0.5 hover:shadow-raised xl:block"
      >
        <span className="flex items-center justify-between">
          <span className="grid size-8 place-items-center rounded-lg bg-sunken text-ink">
            <KeyRound className="size-4" aria-hidden />
          </span>
          <span className="kbd">CODE</span>
        </span>
        <p className="mt-3 text-[14px] font-medium leading-tight">Got an event code?</p>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">Unlock a private event in one step.</p>
      </button>
      <button
        onClick={onEnterCode}
        title="Enter event code"
        aria-label="Enter event code"
        className="mx-auto grid size-10 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink xl:hidden"
      >
        <KeyRound className="size-[18px]" />
      </button>
    </aside>
  );
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className={cn(
          "flex h-10 items-center justify-center gap-3 rounded-xl px-2.5 text-[14px] font-medium transition-[background-color,color,box-shadow] duration-fast ease-out xl:justify-start",
          active ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
        )}
      >
        <Icon className={cn("size-[18px] shrink-0", active ? "text-ink" : "text-ink-subtle")} strokeWidth={active ? 2.1 : 1.8} />
        <span className="hidden xl:inline">{item.label}</span>
      </Link>
    </li>
  );
}
