"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { workspaceFor, type Workspace } from "@/components/shell/nav";
import { BrandLogo } from "./Brand";
import { ThemeSwitch } from "./ThemeSwitch";
import { BottomSheet } from "@/components/ui/BottomSheet";

export interface NavViewer {
  name: string;
  email: string;
  image?: string | null;
  isOrganizer: boolean;
  isAdmin?: boolean;
}

async function logout() {
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
  window.location.href = "/dashboard";
}

const PUBLIC_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/calendar", label: "Calendar" },
  { href: "/passes", label: "Passes" },
  { href: "/host", label: "Host" },
];

const SIGNED_IN_LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/calendar", label: "Calendar" },
  { href: "/passes", label: "Passes" },
  { href: "/certificates", label: "Certs" },
];

/**
 * Sticky charcoal editorial navbar:
 * Cormorant italic champagne-gold "EvntCult" wordmark left,
 * micro-tracked uppercase links right + gold outlined CTA button.
 */
export function SiteHeader({
  viewer,
  onSearch,
  onEnterCode,
}: {
  viewer: NavViewer | null;
  wide?: boolean;
  onSearch: () => void;
  onEnterCode: () => void;
}) {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  const isPublicHero = !viewer && pathname === "/dashboard";
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileMenu(false), [pathname]);

  const navLinks = ws === "admin" ? [] : viewer ? SIGNED_IN_LINKS : PUBLIC_LINKS;
  const transparent = isPublicHero && !scrolled && !mobileMenu;

  return (
    <>
      <header
        ref={ref}
        className={cn(
          "z-40 h-[76px] pt-[env(safe-area-inset-top)] transition-colors duration-base print:hidden",
          isPublicHero ? "fixed inset-x-0 top-0" : "sticky top-0",
          transparent
            ? "border-b border-transparent bg-[#161820]/30 backdrop-blur-[10px] text-[#EFEAE0]"
            : "border-b border-line bg-canvas/90 backdrop-blur-[14px] text-ink",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-6 px-5 md:px-10">
          <div className="flex items-center gap-3">
            <Link
              href={ws === "admin" ? "/admin" : "/dashboard"}
              aria-label="EvntCult home"
              className="py-1"
            >
              <BrandLogo className="text-[28px] md:text-[32px]" />
            </Link>
            {ws === "admin" && (
              <span className="tr-meta border border-line px-2 py-0.5 text-ink-muted">
                Admin
              </span>
            )}
          </div>

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.length > 0 && (
              <nav aria-label="Main" className="flex items-center gap-6">
                {navLinks.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "tr-meta tr-link py-1 transition-colors",
                        active
                          ? "text-[#D4B87A]"
                          : transparent
                            ? "text-[#EFEAE0]/80 hover:text-[#EFEAE0]"
                            : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                {ws !== "admin" && (
                  <button
                    type="button"
                    onClick={onSearch}
                    className={cn(
                      "tr-meta tr-link py-1 transition-colors",
                      transparent
                        ? "text-[#EFEAE0]/80 hover:text-[#EFEAE0]"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    Search
                  </button>
                )}
              </nav>
            )}

            <div className="flex items-center gap-3">
              {viewer && <NotificationBell />}
              {!viewer ? (
                <Link
                  href="/signin?mode=signup"
                  className="group inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#D4B87A] px-5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#D4B87A] transition-colors hover:bg-[#D4B87A] hover:text-[#161820]"
                >
                  <span>Sign up</span>
                  <ArrowRight className="size-3.5 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
                </Link>
              ) : viewer.isOrganizer && ws !== "admin" ? (
                <Link
                  href="/organizer/events/new"
                  className="group inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#D4B87A] px-5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#D4B87A] transition-colors hover:bg-[#D4B87A] hover:text-[#161820]"
                >
                  <span>Host event</span>
                  <ArrowRight className="size-3.5 transition-transform duration-base group-hover:translate-x-0.5" aria-hidden />
                </Link>
              ) : null}

              {viewer && (
                <AccountMenu
                  viewer={viewer}
                  ws={ws}
                  onEnterCode={onEnterCode}
                />
              )}
            </div>
          </div>

          {/* Mobile: Gold CTA + clean Menu toggle */}
          <div className="flex items-center gap-3 md:hidden">
            {!viewer ? (
              <Link
                href="/signin?mode=signup"
                className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[#D4B87A] px-3.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#D4B87A]"
              >
                Sign up
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSearch}
                className="tr-meta inline-flex min-h-[44px] items-center px-2 text-ink-muted hover:text-ink"
              >
                Search
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              aria-expanded={mobileMenu}
              aria-label="Open menu"
              className={cn(
                "tr-meta inline-flex min-h-[44px] items-center px-2",
                transparent ? "text-[#EFEAE0]" : "text-ink",
              )}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <MobileDrawer
          viewer={viewer}
          ws={ws}
          pathname={pathname}
          onClose={() => setMobileMenu(false)}
          onSearch={onSearch}
          onEnterCode={onEnterCode}
        />
      )}
    </>
  );
}

function useDismiss(open: boolean, close: () => void) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) =>
      box.current && !box.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return box;
}

const menuItem =
  "flex w-full items-center justify-between px-4 py-3 text-left text-[14px] text-ink transition-colors hover:bg-sunken";

function AccountMenu({
  viewer,
  ws,
  onEnterCode,
}: {
  viewer: NavViewer;
  ws: Workspace;
  onEnterCode: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "grid size-10 place-items-center rounded-full border border-line text-[11px] font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]",
          open && "border-[#D4B87A] text-[#D4B87A]",
        )}
      >
        {initials(viewer.name)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[52px] z-50 w-64 overflow-hidden rounded-[8px] border border-line-strong bg-surface py-2 text-ink"
        >
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate font-display text-[22px] italic leading-tight text-ink">{viewer.name}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">{viewer.email}</p>
          </div>
          <Link role="menuitem" href="/vault" className={menuItem}>Photo Vault</Link>
          <Link role="menuitem" href="/venues" className={menuItem}>Venues</Link>
          <Link role="menuitem" href="/profile" className={menuItem}>Profile</Link>
          <div className="my-1 h-px bg-line" />
          {viewer.isOrganizer ? (
            <Link role="menuitem" href="/organizer" className={menuItem}>My hosted events</Link>
          ) : (
            <Link role="menuitem" href="/host" className={menuItem}>Apply to host</Link>
          )}
          {viewer.isAdmin && ws !== "admin" && (
            <Link role="menuitem" href="/admin" className={menuItem}>Admin</Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEnterCode();
            }}
            className={menuItem}
          >
            Enter event code
          </button>
          <div className="my-1 h-px bg-line" />
          <div className="px-3 py-2">
            <ThemeSwitch />
          </div>
          <div className="my-1 h-px bg-line" />
          <button type="button" role="menuitem" onClick={logout} className={cn(menuItem, "text-ink-muted hover:text-ink")}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileDrawer({
  viewer,
  ws,
  pathname,
  onClose,
  onSearch,
  onEnterCode,
}: {
  viewer: NavViewer | null;
  ws: Workspace;
  pathname: string;
  onClose: () => void;
  onSearch: () => void;
  onEnterCode: () => void;
}) {
  const row = "flex min-h-[48px] w-full items-center justify-between text-left font-display text-[28px] italic text-ink";

  return (
    <BottomSheet label="Navigation menu" onClose={onClose}>
      <nav aria-label="Mobile navigation" className="divide-y divide-line border-t border-line">
        {(viewer ? SIGNED_IN_LINKS : PUBLIC_LINKS).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(row, pathname === item.href && "text-[#D4B87A]")}
          >
            <span>{item.label}</span>
            <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            onClose();
            onSearch();
          }}
          className={row}
        >
          <span>Search</span>
          <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
        </button>
        {viewer && (
          <>
            <Link href="/vault" onClick={onClose} className={row}>
              <span>Photo Vault</span>
              <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
            </Link>
            <Link href="/venues" onClick={onClose} className={row}>
              <span>Venues</span>
              <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
            </Link>
            <Link href="/profile" onClick={onClose} className={row}>
              <span>Profile</span>
              <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
            </Link>
            {viewer.isOrganizer && (
              <Link href="/organizer" onClick={onClose} className={row}>
                <span>Organizer</span>
                <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
              </Link>
            )}
            {viewer.isAdmin && ws !== "admin" && (
              <Link href="/admin" onClick={onClose} className={row}>
                <span>Admin</span>
                <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEnterCode();
              }}
              className={row}
            >
              <span>Event code</span>
              <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
            </button>
          </>
        )}
      </nav>

      <div className="mt-5 space-y-3 border-t border-line pt-4">
        <ThemeSwitch />
        {viewer ? (
          <button
            type="button"
            onClick={logout}
            className="tr-meta flex min-h-[44px] w-full items-center justify-center rounded-[6px] border border-line text-ink-muted"
          >
            Log out
          </button>
        ) : (
          <Link
            href="/signin"
            onClick={onClose}
            className="tr-meta flex min-h-[44px] w-full items-center justify-center rounded-[6px] border border-line text-ink"
          >
            Log in
          </Link>
        )}
      </div>
    </BottomSheet>
  );
}
