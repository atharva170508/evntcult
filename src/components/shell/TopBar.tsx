"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, KeyRound, LayoutDashboard, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { LogoWordmark } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";
import { NAV, ORGANIZER_NAV, PUBLIC_NAV, isActive } from "./nav";

export interface NavViewer {
  name: string;
  email: string;
  image?: string | null;
  isOrganizer: boolean;
}

async function logout() {
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
  window.location.href = "/dashboard";
}

/**
 * Sticky glass header. Signed in: a Raycast-style command search (Ctrl/⌘ K) plus code and
 * account menu. Signed out: logo, public links, Log in / Sign up. Phones get a drawer.
 */
export function TopBar({ viewer, onEnterCode }: { viewer: NavViewer | null; onEnterCode: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (inputRef.current && inputRef.current.offsetParent !== null) inputRef.current.focus();
        else setDrawer(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 h-[var(--header-h)] transition-[background-color,box-shadow] duration-base ease-out print:hidden",
          scrolled ? "glass shadow-[0_1px_0_theme(colors.line.DEFAULT)]" : "bg-canvas",
        )}
      >
        <div className={cn("mx-auto flex h-full items-center gap-3 px-gutter", viewer ? "max-w-shell" : "max-w-shell")}>
          <Link href="/dashboard" className={cn("flex shrink-0 items-center", viewer && "md:hidden")} aria-label="EvntCult home">
            <LogoWordmark motion="blink" className="text-[24px] text-ink" />
          </Link>

          {!viewer && (
            <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
              {PUBLIC_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors duration-fast",
                    isActive(pathname, l.href) ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          {viewer && <CommandSearch inputRef={inputRef} className="hidden md:flex" />}

          <div className="ml-auto flex items-center gap-1.5">
            {viewer ? (
              <>
                <button onClick={onEnterCode} className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
                  <KeyRound className="size-3.5" aria-hidden /> Enter code
                </button>
                <AccountMenu viewer={viewer} />
              </>
            ) : (
              <>
                <Link href="/signin" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
                  Log in
                </Link>
                <Link href="/signin?mode=signup" className={buttonClass("primary", "sm")}>
                  Sign up
                </Link>
              </>
            )}
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              aria-expanded={drawer}
              className="ml-1 grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.05] md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} viewer={viewer} onEnterCode={onEnterCode} pathname={pathname} />
    </>
  );
}

/* ── Command search ─────────────────────────────────────── */

function CommandSearch({ inputRef, className }: { inputRef?: React.RefObject<HTMLInputElement | null>; className?: string }) {
  return (
    <form
      action="/events"
      role="search"
      className={cn(
        "group h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface pl-3.5 pr-1.5 shadow-card transition-shadow duration-fast focus-within:shadow-raised md:max-w-[520px]",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
      <input
        ref={inputRef}
        name="q"
        type="search"
        placeholder="Search events, clubs, venues"
        className="min-w-0 flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search events"
      />
      <select
        name="when"
        defaultValue=""
        aria-label="When"
        className="hidden h-7 cursor-pointer rounded-full bg-sunken px-2.5 text-[12.5px] font-medium text-ink-2 focus:outline-none lg:block"
      >
        <option value="">Any day</option>
        <option value="today">Today</option>
        <option value="weekend">This weekend</option>
        <option value="week">This week</option>
      </select>
      <span className="kbd hidden xl:inline-flex" aria-hidden>
        Ctrl K
      </span>
    </form>
  );
}

/* ── Account menu ───────────────────────────────────────── */

function AccountMenu({ viewer }: { viewer: NavViewer }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${viewer.name}`}
        className="flex h-9 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-ink/[0.05]"
      >
        <span className="grid size-7 place-items-center rounded-full bg-ink text-[11.5px] font-medium text-white">{initials(viewer.name)}</span>
        <ChevronDown className={cn("size-3.5 text-ink-muted transition-transform duration-base ease-out", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-64 origin-top-right animate-scale-in rounded-card bg-surface p-1.5 shadow-pop">
          <div className="px-3 pb-2.5 pt-2">
            <p className="truncate text-[14px] font-medium">{viewer.name}</p>
            <p className="truncate text-[12.5px] text-ink-muted">{viewer.email}</p>
          </div>
          <div className="h-px bg-line" />
          <MenuLink href="/profile" icon={UserRound} onClick={() => setOpen(false)}>
            Profile
          </MenuLink>
          {viewer.isOrganizer && (
            <MenuLink href="/organizer" icon={LayoutDashboard} onClick={() => setOpen(false)}>
              Organizer console
            </MenuLink>
          )}
          <div className="h-px bg-line" />
          <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 transition-colors hover:bg-ink/[0.04] hover:text-ink">
            <LogOut className="size-4 text-ink-subtle" aria-hidden /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, children, onClick }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link role="menuitem" href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 transition-colors hover:bg-ink/[0.04] hover:text-ink">
      <Icon className="size-4 text-ink-subtle" aria-hidden /> {children}
    </Link>
  );
}

/* ── Mobile drawer ──────────────────────────────────────── */

function MobileDrawer({
  open,
  onClose,
  viewer,
  onEnterCode,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  viewer: NavViewer | null;
  onEnterCode: () => void;
  pathname: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const items = viewer ? (viewer.isOrganizer ? [...NAV, ORGANIZER_NAV] : NAV) : null;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Menu"
      className="ml-auto mr-0 h-dvh max-h-dvh w-[min(88vw,360px)] bg-canvas p-0 text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] open:animate-slide-in-right md:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[var(--header-h)] items-center justify-between px-5">
          <LogoWordmark motion="still" className="text-[22px]" />
          <button onClick={onClose} aria-label="Close menu" className="-mr-2 grid size-9 place-items-center rounded-full transition-colors hover:bg-ink/[0.05]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {viewer && <CommandSearch className="flex w-full" />}

          <nav className="mt-6" aria-label="Main">
            <ul className="space-y-0.5">
              {items
                ? items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-12 items-center gap-3 rounded-xl px-3 text-[16px] font-medium transition-colors",
                            active ? "bg-surface shadow-card" : "text-ink-2 hover:bg-ink/[0.04]",
                          )}
                        >
                          <item.icon className="size-5 text-ink-subtle" aria-hidden /> {item.label}
                        </Link>
                      </li>
                    );
                  })
                : PUBLIC_NAV.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="flex h-14 items-center justify-between border-b border-line text-[22px] font-semibold tracking-tighter">
                        {l.label} <ArrowRight className="size-5 text-ink-subtle" aria-hidden />
                      </Link>
                    </li>
                  ))}
            </ul>
          </nav>
        </div>

        <div className="space-y-2 border-t border-line p-5">
          {viewer ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEnterCode();
                }}
                className={buttonClass("secondary", "lg", "w-full")}
              >
                <KeyRound className="size-4" aria-hidden /> Enter event code
              </button>
              <div className="flex items-center gap-3 pt-2">
                <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-ink/[0.04]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-medium text-white">{initials(viewer.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{viewer.name}</span>
                    <span className="block truncate text-[12.5px] text-ink-muted">{viewer.email}</span>
                  </span>
                </Link>
                <button onClick={logout} aria-label="Log out" className="grid size-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink">
                  <LogOut className="size-[18px]" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/signin?mode=signup" className={buttonClass("accent", "lg", "w-full")}>
                Sign up free
              </Link>
              <Link href="/signin" className={buttonClass("secondary", "lg", "w-full")}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
