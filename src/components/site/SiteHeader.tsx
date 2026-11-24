"use client";

import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Download,
  Images,
  KeyRound,
  LogOut,
  MapPinned,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { m } from "motion/react";
import { EASE } from "@/components/motion/MotionProvider";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { ATTEND_NAV, VISITOR_HREF, isActive, isMainActive, workspaceFor, type Workspace } from "@/components/shell/nav";
import { BrandLogo } from "./Brand";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { toast } from "@/components/ui/Toaster";
import { CompactSearch, HeaderSearch } from "./HeaderSearch";
import {
  CalendarIcon,
  CertificateIcon,
  EventsIcon,
  HomeIcon,
  HostIcon,
  PassIcon,
} from "./TabIcons";

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

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const TAB_ICONS: Record<string, Tab["icon"]> = {
  "/dashboard": HomeIcon,
  "/events": EventsIcon,
  "/calendar": CalendarIcon,
  "/passes": PassIcon,
  "/certificates": CertificateIcon,
};
/** Home · Discover · Calendar · My Passes · Certificates, with the illustrated icons. */
const ATTEND_TABS: Tab[] = ATTEND_NAV.map((n) => ({ href: n.href, label: n.label, icon: TAB_ICONS[n.href] }));
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
  const [hoverTab, setHoverTab] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [logoWobble, setLogoWobble] = useState(0);
  const logoTaps = useRef<number[]>([]);
  const logoUnlockCount = useRef(0);
  const ref = useRef<HTMLElement>(null);

  const onLogoClick = () => {
    const now = Date.now();
    logoTaps.current = [...logoTaps.current.filter((t) => now - t < 2200), now];
    if (logoTaps.current.length >= 5) {
      logoTaps.current = [];
      const quips = [
        "Secret backstage door found. Act casual.",
        "Still no free merch, sorry.",
        "Okay fine, you're officially on the guest list.",
      ];
      const msg = quips[logoUnlockCount.current % quips.length];
      logoUnlockCount.current += 1;
      setLogoWobble((w) => w + 1);
      toast(msg, { tone: "info" });
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`,
      );
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

  return (
    <>
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,background-color] duration-base ease-out supports-[not(backdrop-filter:blur(1px))]:bg-canvas print:hidden",
          scrolled && "bg-canvas/90 shadow-[0_12px_32px_-16px_rgba(10,10,20,0.45)]",
        )}
      >
        <div
          className={cn(
            "mx-auto px-gutter",
            wide ? "max-w-[1440px]" : "max-w-[1360px]",
          )}
        >
          <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 md:h-[72px] md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <Link
                href={
                  ws === "host"
                    ? "/organizer"
                    : ws === "admin"
                      ? "/admin"
                      : "/dashboard"
                }
                onClick={onLogoClick}
                aria-label="EvntCult home"
                className="rounded-lg py-1"
              >
                <m.span
                  key={logoWobble}
                  animate={logoWobble > 0 ? { rotate: [0, -10, 10, -6, 4, 0] } : undefined}
                  transition={{ duration: 0.45 }}
                  className="inline-flex"
                >
                  <BrandLogo className="text-[20px] md:text-[22px]" />
                </m.span>
              </Link>
              {ws !== "attend" && (
                <span className="hidden rounded-md border border-line-strong bg-sunken px-2 py-0.5 text-[11.5px] font-semibold text-ink-2 sm:inline">
                  {ws === "host" ? "Hosting" : "Admin"}
                </span>
              )}
            </div>

            <div className="hidden justify-center md:flex">
              {tabs.length > 0 && (
                <nav
                  aria-label="Main"
                  className="flex items-center gap-0.5 rounded-full border border-line-strong/80 bg-sunken/80 p-1 shadow-[inset_0_1px_2px_rgba(60,40,10,0.05)]"
                  onPointerLeave={() => setHoverTab(null)}
                >
                  {tabs.map((t) => {
                    const active = ws === "attend" ? isMainActive(pathname, t.href) : isActive(pathname, t);
                    return (
                      <Link
                        key={t.href}
                        href={!viewer && VISITOR_HREF[t.href] ? VISITOR_HREF[t.href] : t.href}
                        aria-current={active ? "page" : undefined}
                        onPointerEnter={() => setHoverTab(t.href)}
                        className={cn(
                          "relative flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[14px] transition-colors duration-fast",
                          active
                            ? "font-semibold text-ink"
                            : "font-medium text-ink-muted hover:text-ink",
                        )}
                      >
                        {active && (
                          <m.span
                            layoutId="nav-active-pill"
                            aria-hidden
                            className="absolute inset-0 -z-10 rounded-full bg-surface shadow-[0_1px_3px_rgba(60,40,10,0.12),0_0_0_1px_rgba(26,26,26,0.06)]"
                            transition={{ type: "spring", stiffness: 460, damping: 36 }}
                          />
                        )}
                        {!active && hoverTab === t.href && (
                          <m.span
                            layoutId="nav-hover"
                            aria-hidden
                            className="absolute inset-0 -z-20 rounded-full bg-surface/50"
                            transition={{ type: "spring", stiffness: 520, damping: 40 }}
                          />
                        )}
                        {t.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5">
              {ws === "attend" && (
                <>
                  <button
                    type="button"
                    onClick={onSearch}
                    aria-label="Search events"
                    className="hidden h-9 items-center gap-2 rounded-full border border-line-strong/80 bg-surface/75 px-3 text-[13px] font-medium text-ink-muted transition-colors duration-fast hover:border-ink-subtle hover:text-ink xl:flex"
                  >
                    <Search className="size-3.5 text-ink-muted" strokeWidth={2.2} aria-hidden />
                    <span>Search</span>
                    <kbd className="kbd ml-1 text-[10px]">/</kbd>
                  </button>
                  {viewer && (
                    <button
                      type="button"
                      onClick={onEnterCode}
                      aria-label="Enter event code"
                      className="hidden h-9 items-center gap-1.5 rounded-full border border-line-strong/80 bg-surface/75 px-3 text-[13px] font-medium text-ink-2 transition-colors duration-fast hover:border-ink-subtle hover:text-ink xl:flex"
                    >
                      <KeyRound className="size-3.5 text-ink-muted" strokeWidth={2.1} aria-hidden />
                      <span>Code</span>
                    </button>
                  )}
                </>
              )}
              {ws === "host" ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold text-ink transition-colors duration-fast hover:bg-sunken xl:flex"
                  >
                    Attending
                  </Link>
                  <Link
                    href="/organizer/events/new"
                    className="ui-press mr-0.5 hidden h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-lavender px-3.5 text-[13.5px] font-semibold text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover md:flex"
                  >
                    <Plus className="size-4" strokeWidth={2.6} aria-hidden />{" "}
                    Create event
                  </Link>
                </>
              ) : ws === "attend" && viewer?.isOrganizer ? (
                <Link
                  href="/organizer"
                  className="hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold text-ink transition-colors duration-fast hover:bg-sunken xl:flex"
                >
                  Hosting
                </Link>
              ) : !viewer ? (
                <>
                  <Link
                    href="/signin"
                    className="hidden h-9 items-center whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold text-ink transition-colors duration-fast hover:bg-sunken xl:flex"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signin?mode=signup"
                    className="ui-press mr-0.5 hidden h-9 items-center whitespace-nowrap rounded-xl bg-lavender px-4 text-[13.5px] font-semibold text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover md:flex"
                  >
                    Sign up
                  </Link>
                </>
              ) : null}

              <button
                onClick={onSearch}
                aria-label="Search events"
                className="grid size-10 place-items-center rounded-full text-ink transition-colors duration-fast active:bg-sunken xl:hidden"
              >
                <Search className="size-[19px]" strokeWidth={2.1} aria-hidden />
              </button>
              {viewer && (
                <span className="hidden md:block">
                  <NotificationBell />
                </span>
              )}
              <AccountMenu viewer={viewer} ws={ws} onEnterCode={onEnterCode} />
              {viewer ? (
                <button
                  onClick={() => setSheet(true)}
                  aria-label="Account and more"
                  className="ml-0.5 grid size-10 place-items-center rounded-full transition-transform duration-fast active:scale-95 md:hidden"
                >
                  <Avatar name={viewer.name} className="size-8 text-[12px]" />
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="ml-1 flex h-9 items-center whitespace-nowrap rounded-[10px] bg-lavender px-3.5 text-[13.5px] font-bold text-ink ring-2 ring-inset ring-ink md:hidden"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      {sheet && viewer && (
        <MenuSheet
          viewer={viewer}
          ws={ws}
          pathname={pathname}
          tabs={tabs}
          onClose={() => setSheet(false)}
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

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

const menuItem =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-ink transition-colors hover:bg-sunken";

function AccountMenu({
  viewer,
  ws,
  onEnterCode,
}: {
  viewer: NavViewer | null;
  ws: Workspace;
  onEnterCode: () => void;
}) {
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
          "grid size-9 cursor-pointer place-items-center rounded-full border border-line-strong/80 bg-surface text-ink transition-[border-color,box-shadow,transform] duration-fast hover:border-ink-subtle hover:shadow-raised active:scale-95",
          open && "border-ink shadow-raised",
        )}
      >
        {viewer ? (
          <Avatar name={viewer.name} className="size-7 text-[11px]" />
        ) : (
          <Menu className="size-4 text-ink" strokeWidth={2.2} aria-hidden />
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[52px] z-50 w-64 origin-top-right overflow-hidden rounded-xl bg-white py-2 text-ink shadow-pop ring-1 ring-black/[0.04] motion-safe:animate-scale-in"
        >
          {viewer ? (
            <>
              <div className="px-4 pb-2 pt-1">
                <p className="truncate text-[14px] font-semibold">
                  {viewer.name}
                </p>
                <p className="truncate text-[12.5px] text-ink-subtle">
                  {viewer.email}
                </p>
              </div>
              <Sep />
              <Link
                role="menuitem"
                href="/vault"
                className={cn(menuItem, "font-semibold")}
              >
                Photo Vault
              </Link>
              <Link
                role="menuitem"
                href="/venues"
                className={cn(menuItem, "font-semibold")}
              >
                Venues
              </Link>
              <Link
                role="menuitem"
                href="/profile"
                className={cn(menuItem, "font-semibold")}
              >
                Profile
              </Link>
              <Sep />
              {ws === "attend" ? (
                <Link
                  role="menuitem"
                  href={viewer.isOrganizer ? "/organizer" : "/host"}
                  className={menuItem}
                >
                  {viewer.isOrganizer ? "Switch to hosting" : "Apply to host events"}
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
              <Sep />
              <div className="px-3 py-2">
                <p className="mb-1.5 text-[12px] font-semibold text-ink-muted">Appearance</p>
                <ThemeSwitch />
              </div>
              <Sep />
              <button role="menuitem" onClick={logout} className={menuItem}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                role="menuitem"
                href="/signin?mode=signup"
                className={cn(menuItem, "font-semibold")}
              >
                Sign up
              </Link>
              <Link role="menuitem" href="/signin" className={menuItem}>
                Log in
              </Link>
              <Sep />
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
  viewer: NavViewer;
  ws: Workspace;
  pathname: string;
  tabs: Tab[];
  onClose: () => void;
  onEnterCode: () => void;
}) {
  const row = "flex min-h-[52px] w-full items-center gap-3.5 text-left text-[16px] text-ink active:opacity-60";
  const ic = "size-[20px] shrink-0 text-ink-muted";

  return (
    <BottomSheet label="Account and more" onClose={onClose}>
      <Link href="/profile" className="mt-1 flex items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-line active:bg-sunken">
        <Avatar name={viewer.name} className="size-12 text-[15px]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[22px] leading-tight">{viewer.name}</span>
          <span className="block text-[13.5px] text-ink-subtle">Profile and settings</span>
        </span>
        <ChevronRight className="size-5 text-ink-subtle" aria-hidden />
      </Link>

      {ws === "host" ? (
        <Link href="/organizer/events/new" className="mt-3 flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-lavender text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink">
          <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create event
        </Link>
      ) : null}

      <ul className="mt-2 divide-y divide-line">
        {ws === "admin" &&
          tabs.map((t) => (
            <li key={t.href}>
              <Link href={t.href} aria-current={isActive(pathname, t) ? "page" : undefined} className={cn(row, isActive(pathname, t) && "font-semibold")}>
                {t.label}
              </Link>
            </li>
          ))}
        <li>
          {ws === "host" ? (
            <Link href="/dashboard" className={row}>
              <Repeat className={ic} aria-hidden /> Switch to attending
            </Link>
          ) : (
            <Link href={viewer.isOrganizer ? "/organizer" : "/host"} className={row}>
              <Repeat className={ic} aria-hidden /> {viewer.isOrganizer ? "Switch to hosting" : "Host an event"}
            </Link>
          )}
        </li>
        <li>
          <button
            onClick={() => {
              onClose();
              onEnterCode();
            }}
            className={row}
          >
            <KeyRound className={ic} aria-hidden /> Enter an event code
          </button>
        </li>
        {ws === "attend" && (
          <>
            <li>
              <Link href="/vault" className={row}>
                <Images className={ic} aria-hidden /> Photo Vault
              </Link>
            </li>
            <li>
              <Link href="/venues" className={row}>
                <MapPinned className={ic} aria-hidden /> Venues
              </Link>
            </li>
          </>
        )}
        {viewer.isAdmin && ws !== "admin" && (
          <li>
            <Link href="/admin" className={row}>
              <ShieldCheck className={ic} aria-hidden /> Admin
            </Link>
          </li>
        )}
        <li>
          <Link href="/get-app" className={row}>
            <Download className={ic} aria-hidden /> Get the app
          </Link>
        </li>
      </ul>

      <ThemeSwitch className="mt-3" />
      <button onClick={logout} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-ink-muted active:bg-sunken">
        <LogOut className="size-4" aria-hidden /> Log out
      </button>
    </BottomSheet>
  );
}
