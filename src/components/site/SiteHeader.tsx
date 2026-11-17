"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Award, Download, KeyRound, LogOut, MapPinned, Menu, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { m } from "motion/react";
import { EASE } from "@/components/motion/MotionProvider";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { isActive, workspaceFor, type Workspace } from "@/components/shell/nav";
import { BrandLogo } from "./Brand";
import { CompactSearch, HeaderSearch } from "./HeaderSearch";
import { CalendarIcon, EventsIcon, HostIcon, PassIcon, PhotosIcon } from "./TabIcons";

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

type Tab = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

const ATTEND_TABS: Tab[] = [
  { href: "/events", label: "Events", icon: EventsIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/passes", label: "Passes", icon: PassIcon },
  { href: "/vault", label: "Photos", icon: PhotosIcon },
];
const HOST_TABS: Tab[] = [
  { href: "/organizer", label: "Your events", icon: HostIcon, exact: true },
  { href: "/organizer/calendar", label: "Calendar", icon: CalendarIcon },
];

/** Pages that open with the big search bar under the tabs. */
const SEARCH_PAGES = ["/dashboard", "/events"];

/**
 * The header. Logo on the left, illustrated tabs in the middle, hosting switch, notifications
 * and the account menu on the right. Home and Discover add the big search bar underneath; it
 * folds into a compact pill once you scroll. Phones get a search button and a menu.
 */
export function SiteHeader({
  viewer,
  wide = false,
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
  const hasSearch = ws === "attend" && SEARCH_PAGES.includes(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setSheet(false), [pathname]);

  const tabs = ws === "host" ? HOST_TABS : ws === "admin" ? [] : ATTEND_TABS;
  const compact = hasSearch && scrolled;

  return (
    <>
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-40 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow,border-color] duration-base ease-out print:hidden",
          scrolled ? "border-line/80 bg-canvas/80 shadow-[0_8px_24px_-12px_rgba(60,40,10,0.18)]" : "border-line bg-canvas/95",
        )}
      >
        <div className={cn("mx-auto px-gutter", wide ? "max-w-[1440px]" : "max-w-[1360px]")}>
          <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <Link href={ws === "host" ? "/organizer" : ws === "admin" ? "/admin" : "/dashboard"} aria-label="EvntCult home" className="rounded-lg py-1">
                <BrandLogo className="text-[24px]" />
              </Link>
              {ws !== "attend" && (
                <span className="hidden rounded-full bg-sunken px-2.5 py-1 text-[12px] font-semibold text-ink-2 sm:inline">{ws === "host" ? "Hosting" : "Admin"}</span>
              )}
            </div>

            <div className="hidden justify-center md:flex">
              {compact ? (
                <div className="motion-safe:animate-scale-in">
                  <CompactSearch onOpen={onSearch} />
                </div>
              ) : (
                <nav aria-label="Main" className="flex items-center gap-2">
                  {tabs.map((t) => {
                    const active = isActive(pathname, t);
                    return (
                      <Link
                        key={t.href}
                        href={t.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-14 items-center gap-2 px-3 text-[15px] transition-colors duration-fast",
                          active ? "font-semibold text-ink" : "font-medium text-ink-muted hover:text-ink",
                        )}
                      >
                        <t.icon className="size-9 transition-transform duration-base ease-out group-hover:scale-110" />
                        {t.label}
                        {active ? (
                          <m.span layoutId="tab-underline" aria-hidden className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-ink" transition={{ duration: 0.45, ease: EASE }} />
                        ) : (
                          <span aria-hidden className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-ink opacity-0 transition-opacity duration-base group-hover:opacity-20" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="flex items-center justify-end gap-1">
              {ws === "host" ? (
                <>
                  <Link href="/dashboard" className="hidden h-10 items-center rounded-full px-3.5 text-[14px] font-semibold text-ink transition-colors hover:bg-sunken lg:flex">
                    Switch to attending
                  </Link>
                  <Link href="/organizer/events/new" className="mr-1 hidden h-10 items-center gap-1.5 rounded-full bg-lavender ring-2 ring-inset ring-ink px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-lavender ring-2 ring-inset ring-ink-hover md:flex">
                    <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create event
                  </Link>
                </>
              ) : ws === "attend" ? (
                <Link
                  href={viewer?.isOrganizer ? "/organizer" : viewer ? "/organizer/events/new" : `/signin?next=${encodeURIComponent("/organizer/events/new")}`}
                  className="hidden h-10 items-center rounded-full px-3.5 text-[14px] font-semibold text-ink transition-colors hover:bg-sunken lg:flex"
                >
                  {viewer?.isOrganizer ? "Switch to hosting" : "Host an event"}
                </Link>
              ) : null}

              <button
                onClick={onSearch}
                aria-label="Search events"
                className="grid size-10 place-items-center rounded-full bg-sunken text-ink transition-colors hover:bg-mist md:hidden"
              >
                <Search className="size-[18px]" strokeWidth={2.2} aria-hidden />
              </button>
              {viewer && (
                <span className="hidden md:block">
                  <NotificationBell />
                </span>
              )}
              <AccountMenu viewer={viewer} ws={ws} onEnterCode={onEnterCode} />
              <button onClick={() => setSheet(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-full transition-colors hover:bg-sunken md:hidden">
                <Menu className="size-[20px]" aria-hidden />
              </button>
            </div>
          </div>

          {hasSearch && !compact && (
            <div className="hidden justify-center pb-6 pt-1 md:flex">
              <Suspense fallback={<div className="h-[66px] w-full max-w-[850px] rounded-full border border-line-strong shadow-search" />}>
                <HeaderSearch className="max-w-[850px]" />
              </Suspense>
            </div>
          )}
        </div>
      </header>
      {sheet && <MenuSheet viewer={viewer} ws={ws} pathname={pathname} tabs={tabs} onClose={() => setSheet(false)} onEnterCode={onEnterCode} />}
    </>
  );
}

function useDismiss(open: boolean, close: () => void) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && close();
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

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white", className)}>
      {initials(name)}
    </span>
  );
}

const menuItem = "flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-ink transition-colors hover:bg-sunken";

function AccountMenu({ viewer, ws, onEnterCode }: { viewer: NavViewer | null; ws: Workspace; onEnterCode: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={box} className="relative ml-1 hidden md:block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex h-[42px] items-center gap-3 rounded-full border border-line-strong bg-white pl-3.5 pr-1.5 transition-shadow duration-base hover:shadow-raised",
          open && "shadow-raised",
        )}
      >
        <Menu className="size-4 text-ink" strokeWidth={2.4} aria-hidden />
        {viewer ? (
          <Avatar name={viewer.name} className="size-[30px] text-[11.5px]" />
        ) : (
          <span className="grid size-[30px] place-items-center rounded-full bg-[#717171] text-white">
            <UserRound className="size-[18px]" fill="currentColor" strokeWidth={0} aria-hidden />
          </span>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[52px] z-50 w-64 origin-top-right overflow-hidden rounded-xl bg-white py-2 text-ink shadow-pop ring-1 ring-black/[0.04] motion-safe:animate-scale-in">
          {viewer ? (
            <>
              <div className="px-4 pb-2 pt-1">
                <p className="truncate text-[14px] font-semibold">{viewer.name}</p>
                <p className="truncate text-[12.5px] text-ink-subtle">{viewer.email}</p>
              </div>
              <Sep />
              <Link role="menuitem" href="/passes" className={cn(menuItem, "font-semibold")}>
                Passes
              </Link>
              <Link role="menuitem" href="/vault" className={cn(menuItem, "font-semibold")}>
                Photos
              </Link>
              <Link role="menuitem" href="/certificates" className={cn(menuItem, "font-semibold")}>
                Certificates
              </Link>
              <Sep />
              {ws === "attend" ? (
                <Link role="menuitem" href={viewer.isOrganizer ? "/organizer" : "/organizer/events/new"} className={menuItem}>
                  {viewer.isOrganizer ? "Switch to hosting" : "Host an event"}
                </Link>
              ) : (
                <Link role="menuitem" href="/dashboard" className={menuItem}>
                  Switch to attending
                </Link>
              )}
              {viewer.isAdmin && ws !== "admin" && (
                <Link role="menuitem" href="/admin" className={menuItem}>
                  Admin
                </Link>
              )}
              <Link role="menuitem" href="/venues" className={menuItem}>
                Venues
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEnterCode();
                }}
                className={menuItem}
              >
                Enter an event code
              </button>
              <Link role="menuitem" href="/profile" className={menuItem}>
                Profile
              </Link>
              <Sep />
              <button role="menuitem" onClick={logout} className={menuItem}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link role="menuitem" href="/signin?mode=signup" className={cn(menuItem, "font-semibold")}>
                Sign up
              </Link>
              <Link role="menuitem" href="/signin" className={menuItem}>
                Log in
              </Link>
              <Sep />
              <Link role="menuitem" href={`/signin?next=${encodeURIComponent("/organizer/events/new")}`} className={menuItem}>
                Host an event
              </Link>
              <Link role="menuitem" href="/venues" className={menuItem}>
                Venues
              </Link>
              <Link role="menuitem" href="/get-app" className={menuItem}>
                Get the app
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Sep() {
  return <div className="my-2 h-px bg-line" />;
}

function MenuSheet({
  viewer,
  ws,
  pathname,
  tabs,
  onClose,
  onEnterCode,
}: {
  viewer: NavViewer | null;
  ws: Workspace;
  pathname: string;
  tabs: Tab[];
  onClose: () => void;
  onEnterCode: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const row = "flex h-14 items-center gap-4 border-b border-line text-[16px] text-ink";

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink md:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-gutter">
        <BrandLogo className="text-[22px]" />
        <button onClick={onClose} aria-label="Close menu" className="grid size-10 place-items-center rounded-full hover:bg-sunken">
          <X className="size-[20px]" aria-hidden />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-gutter pb-10 pt-2">
        {viewer && (
          <Link href="/profile" className="flex items-center gap-3 border-b border-line py-4">
            <Avatar name={viewer.name} className="size-12 text-[15px]" />
            <span className="min-w-0">
              <span className="block truncate text-[17px] font-semibold">{viewer.name}</span>
              <span className="block text-[13.5px] text-ink-subtle">Show profile</span>
            </span>
          </Link>
        )}
        <ul>
          {tabs.map((t, i) => (
            <m.li key={t.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.08 + i * 0.05 }}>
              <Link href={t.href} aria-current={isActive(pathname, t) ? "page" : undefined} className={cn(row, isActive(pathname, t) && "font-semibold")}>
                <t.icon className="size-8" />
                {t.label}
              </Link>
            </m.li>
          ))}
          {ws === "attend" && (
            <>
              <li>
                <Link href="/certificates" className={row}>
                  <Award className="mx-1 size-6 text-ink-muted" aria-hidden /> Certificates
                </Link>
              </li>
              <li>
                <Link href="/venues" className={row}>
                  <MapPinned className="mx-1 size-6 text-ink-muted" aria-hidden /> Venues
                </Link>
              </li>
            </>
          )}
        </ul>
        <div className="mt-6 grid gap-2.5">
          {viewer ? (
            <>
              {ws === "host" ? (
                <>
                  <Link href="/organizer/events/new" className="flex h-12 items-center justify-center gap-2 rounded-lg bg-lavender ring-2 ring-inset ring-ink text-[16px] font-semibold text-ink">
                    <Plus className="size-4" aria-hidden /> Create event
                  </Link>
                  <Link href="/dashboard" className="flex h-12 items-center justify-center rounded-lg border border-ink text-[16px] font-semibold">
                    Switch to attending
                  </Link>
                </>
              ) : (
                <Link href={viewer.isOrganizer ? "/organizer" : "/organizer/events/new"} className="flex h-12 items-center justify-center rounded-lg border border-ink text-[16px] font-semibold">
                  {viewer.isOrganizer ? "Switch to hosting" : "Host an event"}
                </Link>
              )}
              <button
                onClick={() => {
                  onClose();
                  onEnterCode();
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong text-[16px] font-semibold"
              >
                <KeyRound className="size-4" aria-hidden /> Enter an event code
              </button>
              {viewer.isAdmin && (
                <Link href="/admin" className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong text-[16px] font-semibold">
                  <ShieldCheck className="size-4" aria-hidden /> Admin
                </Link>
              )}
              <Link href="/get-app" className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong text-[16px] font-semibold">
                <Download className="size-4" aria-hidden /> Get the app
              </Link>
              <button onClick={logout} className="mt-1 flex h-12 items-center justify-center gap-2 text-[15px] font-semibold text-ink-muted underline underline-offset-4">
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin?mode=signup" className="flex h-12 items-center justify-center rounded-lg bg-lavender ring-2 ring-inset ring-ink text-[16px] font-semibold text-ink">
                Sign up
              </Link>
              <Link href="/signin" className="flex h-12 items-center justify-center rounded-lg border border-ink text-[16px] font-semibold">
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </m.div>
  );
}
