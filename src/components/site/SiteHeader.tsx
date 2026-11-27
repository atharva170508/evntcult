"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
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
 * Tape Room style 76px editorial navbar:
 * Transparent over the public full-bleed hero, becoming solid #151412 after 80px of scroll.
 * Wordmark left, mono links right, one gold pill CTA with a separate round arrow circle.
 * Mobile keeps wordmark, CTA, and a clean text "Menu" toggle.
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
    const onScroll = () => setScrolled(window.scrollY > 80);
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
            ? "border-b border-transparent bg-transparent text-[#EEE8DD]"
            : "border-b border-line bg-canvas text-ink",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-6 px-5 md:px-10">
          <div className="flex items-center gap-3">
            <Link
              href={ws === "admin" ? "/admin" : "/dashboard"}
              aria-label="EvntCult home"
              className="py-1"
            >
              <BrandLogo
                tone={transparent ? "white" : "brand"}
                className="text-[20px] md:text-[22px]"
              />
            </Link>
            {ws === "admin" && (
              <span className="tr-meta border border-line px-2 py-0.5 text-ink-muted">
                Admin
              </span>
            )}
          </div>

          {/* Desktop links + single gold pill with separate round arrow circle */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.length > 0 && (
              <nav aria-label="Main" className="flex items-center gap-7">
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
                          ? "text-[#C9A26B]"
                          : transparent
                            ? "text-[#EEE8DD]/80 hover:text-[#EEE8DD]"
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
                        ? "text-[#EEE8DD]/80 hover:text-[#EEE8DD]"
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
                  className="group inline-flex items-center gap-1.5"
                >
                  <span className="inline-flex h-10 items-center rounded-full bg-[#C9A26B] px-5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412] transition-colors group-hover:bg-[#D7B47F]">
                    Sign up
                  </span>
                  <span
                    aria-hidden
                    className="grid size-10 place-items-center rounded-full bg-[#C9A26B] text-[#151412] transition-transform duration-base ease-out group-hover:translate-x-1 group-hover:bg-[#D7B47F]"
                  >
                    <ArrowUpRight className="size-4" strokeWidth={1.75} />
                  </span>
                </Link>
              ) : viewer.isOrganizer && ws !== "admin" ? (
                <Link
                  href="/organizer/events/new"
                  className="group inline-flex items-center gap-1.5"
                >
                  <span className="inline-flex h-10 items-center rounded-full bg-[#C9A26B] px-5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412] transition-colors group-hover:bg-[#D7B47F]">
                    Host event
                  </span>
                  <span
                    aria-hidden
                    className="grid size-10 place-items-center rounded-full bg-[#C9A26B] text-[#151412] transition-transform duration-base ease-out group-hover:translate-x-1 group-hover:bg-[#D7B47F]"
                  >
                    <ArrowUpRight className="size-4" strokeWidth={1.75} />
                  </span>
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

          {/* Mobile: CTA + quiet text Menu toggle */}
          <div className="flex items-center gap-3 md:hidden">
            {!viewer ? (
              <Link
                href="/signin?mode=signup"
                className="inline-flex min-h-[44px] items-center rounded-full bg-[#C9A26B] px-4 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412]"
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
                transparent ? "text-[#EEE8DD]" : "text-ink",
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
          "grid size-10 place-items-center rounded-full border border-line font-mono text-[11px] uppercase text-ink transition-colors hover:border-[#C9A26B] hover:text-[#C9A26B]",
          open && "border-[#C9A26B] text-[#C9A26B]",
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
            <p className="truncate font-display text-[19px] leading-tight text-ink">{viewer.name}</p>
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
  const row = "flex min-h-[48px] w-full items-center justify-between text-left font-display text-[26px] text-ink";

  return (
    <BottomSheet label="Navigation menu" onClose={onClose}>
      <nav aria-label="Mobile navigation" className="divide-y divide-line border-t border-line">
        {(viewer ? SIGNED_IN_LINKS : PUBLIC_LINKS).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(row, pathname === item.href && "text-[#C9A26B]")}
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
            className="tr-meta flex min-h-[44px] w-full items-center justify-center rounded-[8px] border border-line text-ink-muted"
          >
            Log out
          </button>
        ) : (
          <Link
            href="/signin"
            onClick={onClose}
            className="tr-meta flex min-h-[44px] w-full items-center justify-center rounded-[8px] border border-line text-ink"
          >
            Log in
          </Link>
        )}
      </div>
    </BottomSheet>
  );
}
