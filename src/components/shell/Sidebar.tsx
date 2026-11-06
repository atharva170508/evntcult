"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { NAV, ORGANIZER_NAV, isActive } from "./nav";

/** App-style left menu for laptops (Unstop / Zoho Backstage idea). Hidden on phones. */
export function Sidebar({ isOrganizer, signedIn, onEnterCode }: { isOrganizer: boolean; signedIn: boolean; onEnterCode: () => void }) {
  const pathname = usePathname();
  const items = isOrganizer ? [...NAV, ORGANIZER_NAV] : NAV;

  return (
    <aside className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col border-r border-white/[0.06] bg-surface/60 px-3 py-5 backdrop-blur-xl md:flex xl:w-[236px] xl:px-4">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2" aria-label="EvntCult home">
        <Logo />
        <span className="hidden font-serif text-[26px] leading-none tracking-[-0.02em] xl:inline">EvntCult</span>
      </Link>

      {isOrganizer && (
        <Link
          href="/organizer/events/new"
          className="mt-6 flex items-center justify-center gap-2 rounded-full bg-volt py-3 text-[14px] font-bold text-ink-inverse shadow-[0_14px_34px_-16px_rgba(212,255,58,0.55)] transition-colors hover:bg-volt-hover"
        >
          <Plus className="size-[18px]" />
          <span className="hidden xl:inline">Create event</span>
        </Link>
      )}

      <nav className="mt-6 flex-1">
        <p className="eyebrow mb-2 hidden px-3 xl:block">Menu</p>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                {item === ORGANIZER_NAV && <p className="eyebrow mb-2 mt-5 hidden px-3 xl:block">Organize</p>}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
                    "justify-center xl:justify-start",
                    active ? "bg-gradient-to-r from-aurora-1 to-aurora-2 text-white shadow-brand" : "text-ink-muted hover:bg-white/5 hover:text-ink",
                  )}
                >
                  <Icon className="size-[19px] shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {signedIn ? (<>
      <button
        onClick={onEnterCode}
        className="group relative isolate hidden overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-aurora-1/40 via-aurora-2/25 to-transparent p-4 text-left transition-transform hover:-translate-y-0.5 xl:block"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-canvas text-brand-ink shadow-card">
          <KeyRound className="size-4" />
        </span>
        <p className="mt-3 text-[14px] font-bold leading-tight">Got an event code?</p>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">Join a private event in one step.</p>
      </button>
      <button
        onClick={onEnterCode}
        title="Enter event code"
        className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-ink xl:hidden"
      >
        <KeyRound className="size-[18px]" />
      </button>
      </>) : (
        <Link href="/signin?mode=signup" className="hidden rounded-3xl bg-gradient-to-br from-brand-soft to-warn-soft p-4 transition-transform hover:-translate-y-0.5 xl:block">
          <p className="text-[14px] font-bold leading-tight">New here?</p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">Sign up with your college email to register for events.</p>
        </Link>
      )}
    </aside>
  );
}
