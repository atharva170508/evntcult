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
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { m } from "motion/react";
import { EASE } from "@/components/motion/MotionProvider";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { ATTEND_NAV, VISITOR_HREF, isActive, isMainActive, workspaceFor, type Workspace } from "@/components/shell/nav";
import { BrandLogo } from "./Brand";
import { ModalDialog } from "@/components/ui/ModalDialog";
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
  const ref = useRef<HTMLElement>(null);

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
  const compact = hasSearch && scrolled;

  return (
    <>
      <header
        ref={ref}
        className={cn(
          // Search pages: fixed over a spacer of the expanded height, so folding the search on
          // scroll never moves the page (CLS 0). Elsewhere: sticky in the flow.
          hasSearch ? "fixed inset-x-0 top-0" : "sticky top-0",
          "z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-base ease-out supports-[not(backdrop-filter:blur(1px))]:bg-canvas print:hidden",
          scrolled && "shadow-[0_8px_24px_-12px_rgba(60,40,10,0.18)]",
        )}
      >
        <div
          className={cn(
            "mx-auto px-gutter",
            wide ? "max-w-[1440px]" : "max-w-[1360px]",
          )}
        >
          <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <Link
                href={
                  ws === "host"
                    ? "/organizer"
                    : ws === "admin"
                      ? "/admin"
                      : "/dashboard"
                }
                aria-label="EvntCult home"
                className="rounded-lg py-1"
              >
                <BrandLogo className="text-[24px]" />
              </Link>
              {ws !== "attend" && (
                <span className="hidden rounded-lg bg-sunken px-2.5 py-1 text-[12px] font-semibold text-ink-2 sm:inline">
                  {ws === "host" ? "Hosting" : "Admin"}
                </span>
              )}
            </div>

            <div className="hidden justify-center md:flex">
              {compact ? (
                <div className="motion-safe:animate-scale-in">
                  <CompactSearch onOpen={onSearch} />
                </div>
              ) : (
                <nav aria-label="Main" className="flex items-center gap-2" onPointerLeave={() => setHoverTab(null)}>
                  {tabs.map((t) => {
                    const active = ws === "attend" ? isMainActive(pathname, t.href) : isActive(pathname, t);
                    return (
                      <Link
                        key={t.href}
                        href={!viewer && VISITOR_HREF[t.href] ? VISITOR_HREF[t.href] : t.href}
                        aria-current={active ? "page" : undefined}
                        onPointerEnter={() => setHoverTab(t.href)}
                        className={cn(
                          "group relative flex h-14 items-center gap-2 whitespace-nowrap px-3 text-[15px] transition-colors duration-fast xl:px-3",
                          active
                            ? "font-semibold text-ink"
                            : "font-medium text-ink-muted hover:text-ink",
                        )}
                      >
                        {hoverTab === t.href && (
                          <m.span
                            layoutId="nav-hover"
                            aria-hidden
                            className="absolute inset-x-0 inset-y-2 -z-10 rounded-xl bg-sunken"
                            transition={{ type: "spring", stiffness: 520, damping: 40 }}
                          />
                        )}
                        {t.label}
                        {active ? (
                          <m.span
                            layoutId="tab-underline"
                            aria-hidden
                            className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-ink"
                            transition={{ duration: 0.25, ease: EASE }}
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="flex items-center justify-end gap-1">
              {ws === "host" ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden h-10 shrink-0 items-center whitespace-nowrap rounded-xl px-3.5 text-[14px] font-semibold text-ink transition-colors duration-fast hover:bg-sunken xl:flex"
                  >
                    Switch to attending
                  </Link>
                  <Link
                    href="/organizer/events/new"
                    className="mr-1 hidden h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-lavender px-4 text-[14px] font-semibold text-ink ring-2 ring-inset ring-ink transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.97] md:flex"
                  >
                    <Plus className="size-4" strokeWidth={2.6} aria-hidden />{" "}
                    Create event
                  </Link>
                </>
              ) : ws === "attend" && viewer?.isOrganizer ? (
                <Link
                  href="/organizer"
                  className="hidden h-10 shrink-0 items-center whitespace-nowrap rounded-xl px-3.5 text-[14px] font-semibold text-ink transition-colors duration-fast hover:bg-sunken xl:flex"
                >
                  Switch to hosting
                </Link>
              ) : !viewer ? (
                <>
                  <Link
                    href="/signin"
                    className="hidden h-10 items-center whitespace-nowrap rounded-lg px-3 text-[14px] font-semibold text-ink transition-colors duration-fast hover:bg-sunken xl:flex"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signin?mode=signup"
                    className="mr-1 hidden h-10 items-center whitespace-nowrap rounded-xl bg-lavender px-4 text-[14px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover md:flex"
                  >
                    Sign up
                  </Link>
                </>
              ) : null}

              <button
                onClick={onSearch}
                aria-label="Search events"
                className="grid size-11 place-items-center rounded-full bg-sunken text-ink transition-colors duration-fast hover:bg-mist md:hidden"
              >
                <Search className="size-[18px]" strokeWidth={2.2} aria-hidden />
              </button>
              {viewer && (
                <span className="hidden md:block">
                  <NotificationBell />
                </span>
              )}
              <AccountMenu viewer={viewer} ws={ws} onEnterCode={onEnterCode} />
              <button
                onClick={() => setSheet(true)}
                aria-label="Open menu"
                className="grid size-11 place-items-center rounded-full transition-colors duration-fast hover:bg-sunken md:hidden"
              >
                <Menu className="size-[20px]" aria-hidden />
              </button>
            </div>
          </div>

          {hasSearch && !compact && (
            <div className="hidden justify-center pb-6 pt-1 md:flex">
              <Suspense
                fallback={
                  <div className="h-[66px] w-full max-w-[850px] rounded-full border border-line-strong shadow-search" />
                }
              >
                <HeaderSearch className="max-w-[850px]" />
              </Suspense>
            </div>
          )}
        </div>
      </header>
      {hasSearch && <div aria-hidden className="h-[81px] md:h-[175px] print:hidden" />}
      {sheet && (
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
          "flex h-[42px] cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-white pl-3.5 pr-1.5 transition-shadow duration-fast hover:shadow-raised",
          open && "shadow-raised",
        )}
      >
        <Menu className="size-4 text-ink" strokeWidth={2.4} aria-hidden />
        {viewer ? (
          <Avatar name={viewer.name} className="size-[30px] text-[11.5px]" />
        ) : (
          <span className="grid size-[30px] place-items-center rounded-full bg-[#717171] text-white">
            <UserRound
              className="size-[18px]"
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </span>
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
  viewer: NavViewer | null;
  ws: Workspace;
  pathname: string;
  tabs: Tab[];
  onClose: () => void;
  onEnterCode: () => void;
}) {
  const row =
    "flex h-14 items-center gap-4 border-b border-line text-[16px] text-ink";

  return (
    <ModalDialog label="Menu" onClose={onClose} className="md:hidden">
      <m.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="fixed inset-0 z-50 flex flex-col bg-canvas text-ink md:hidden"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-gutter">
          <BrandLogo className="text-[22px]" />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-full hover:bg-sunken"
          >
            <X className="size-[20px]" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-gutter pb-10 pt-2">
          {viewer && (
            <Link
              href="/profile"
              className="flex items-center gap-3 border-b border-line py-4"
            >
              <Avatar name={viewer.name} className="size-12 text-[15px]" />
              <span className="min-w-0">
                <span className="block truncate text-[17px] font-semibold">
                  {viewer.name}
                </span>
                <span className="block text-[13.5px] text-ink-subtle">
                  Show profile
                </span>
              </span>
            </Link>
          )}
          <ul>
            {tabs.map((t, i) => (
              <m.li
                key={t.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.2,
                  ease: EASE,
                  delay: 0.04 + i * 0.03,
                }}
              >
                <Link
                  href={!viewer && VISITOR_HREF[t.href] ? VISITOR_HREF[t.href] : t.href}
                  aria-current={(ws === "attend" ? isMainActive(pathname, t.href) : isActive(pathname, t)) ? "page" : undefined}
                  className={cn(row, (ws === "attend" ? isMainActive(pathname, t.href) : isActive(pathname, t)) && "font-semibold")}
                >
                  {t.label}
                </Link>
              </m.li>
            ))}
            {ws === "attend" && (
              <>
                <li>
                  <Link href="/vault" className={row}>
                    <Images className="mx-1 size-6 text-ink-muted" aria-hidden />{" "}
                    Photo Vault
                  </Link>
                </li>
                <li>
                  <Link href="/venues" className={row}>
                    <MapPinned
                      className="mx-1 size-6 text-ink-muted"
                      aria-hidden
                    />{" "}
                    Venues
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
                    <Link
                      href="/organizer/events/new"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl whitespace-nowrap bg-lavender ring-2 ring-inset ring-ink text-[16px] font-semibold text-ink"
                    >
                      <Plus className="size-4" aria-hidden /> Create event
                    </Link>
                    <Link
                      href="/dashboard"
                      className="flex h-12 items-center justify-center rounded-lg border border-ink text-[16px] font-semibold"
                    >
                      Switch to attending
                    </Link>
                  </>
                ) : (
                  <Link
                    href={viewer.isOrganizer ? "/organizer" : "/host"}
                    className="flex h-12 items-center justify-center rounded-lg border border-ink text-[16px] font-semibold"
                  >
                    {viewer.isOrganizer ? "Switch to hosting" : "Apply to host events"}
                  </Link>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onEnterCode();
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong text-[16px] font-semibold"
                >
                  <KeyRound className="size-4" aria-hidden /> Enter an event
                  code
                </button>
                {viewer.isAdmin && (
                  <Link
                    href="/admin"
                    className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong text-[16px] font-semibold"
                  >
                    <ShieldCheck className="size-4" aria-hidden /> Admin
                  </Link>
                )}
                <Link
                  href="/get-app"
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-line-strong text-[16px] font-semibold"
                >
                  <Download className="size-4" aria-hidden /> Get the app
                </Link>
                <ThemeSwitch className="mt-1" />
                <button
                  onClick={logout}
                  className="mt-1 flex h-12 items-center justify-center gap-2 text-[15px] font-semibold text-ink-muted underline underline-offset-4"
                >
                  <LogOut className="size-4" aria-hidden /> Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin?mode=signup"
                  className="flex h-12 items-center justify-center rounded-xl whitespace-nowrap bg-lavender ring-2 ring-inset ring-ink text-[16px] font-semibold text-ink"
                >
                  Sign up
                </Link>
                <Link
                  href="/signin"
                  className="flex h-12 items-center justify-center rounded-lg border border-ink text-[16px] font-semibold"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </m.div>
    </ModalDialog>
  );
}
