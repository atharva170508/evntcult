"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  Download,
  KeyRound,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { ATTEND_NAV, HOST_NAV, isActive, workspaceFor, type NavItem, type Workspace } from "@/components/shell/nav";
import { BrandLogo } from "./Brand";

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

/** Attend shows four destinations in the bar; the rest live under "More". */
const ATTEND_PRIMARY = ["/events", "/calendar", "/passes", "/vault"];
const PUBLIC_LINKS = [
  { href: "/events", label: "Discover" },
  { href: "/dashboard#how", label: "How it works" },
  { href: "/dashboard#hosts", label: "For organizers" },
];

/**
 * One bar for the whole product. Its colour tells you where you are: white while attending,
 * night navy while hosting or in admin. Search is a command palette (Ctrl/⌘ K or "/").
 * Phones get a full-screen menu; signed-in phones also get the tab bar.
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
  const dark = ws !== "attend";
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
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setSheet(false), [pathname]);

  const links: NavItem[] =
    ws === "host" ? HOST_NAV : ws === "admin" ? [] : ATTEND_NAV.filter((n) => ATTEND_PRIMARY.includes(n.href));
  const more = ws === "attend" ? ATTEND_NAV.filter((n) => !ATTEND_PRIMARY.includes(n.href) && n.href !== "/dashboard") : [];

  return (
    <>
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-40 transition-[background-color,box-shadow] duration-base ease-out print:hidden",
          dark
            ? "bg-night text-white"
            : scrolled
              ? "bg-white/90 shadow-[0_1px_0_#E5E7EB] backdrop-blur-xl backdrop-saturate-150"
              : "bg-white shadow-[0_1px_0_transparent]",
        )}
      >
        <div className={cn("mx-auto flex h-16 items-center gap-2 px-gutter md:h-[72px] md:gap-4", wide ? "max-w-[1440px]" : "max-w-shell")}>
          <Link
            href={ws === "host" ? "/organizer" : ws === "admin" ? "/admin" : "/dashboard"}
            aria-label="EvntCult home"
            className="flex shrink-0 items-center rounded-lg py-1 pr-1"
          >
            <BrandLogo className="text-[23px]" tone={dark ? "white" : "ink"} />
          </Link>
          {ws !== "attend" && (
            <span className="ml-1 hidden rounded-md bg-white/[0.1] px-2 py-1 text-[12px] font-semibold text-white/85 sm:inline">
              {ws === "host" ? "Hosting" : "Admin"}
            </span>
          )}

          {viewer ? (
            <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
              {links.map((l) => (
                <BarLink key={l.href} href={l.href} active={isActive(pathname, l)} dark={dark}>
                  {l.label}
                </BarLink>
              ))}
              {more.length > 0 && <MoreMenu items={more} pathname={pathname} />}
            </nav>
          ) : (
            <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
              {PUBLIC_LINKS.map((l) => (
                <BarLink key={l.href} href={l.href} active={pathname === l.href} dark={false}>
                  {l.label}
                </BarLink>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            {ws !== "admin" && (
              <button
                onClick={onSearch}
                aria-label="Search events"
                className={cn(
                  "group flex h-10 items-center gap-2.5 rounded-xl text-[14px] transition-colors duration-fast",
                  "w-10 justify-center md:w-[232px] md:justify-start md:px-3.5",
                  dark
                    ? "text-white/80 hover:text-white md:bg-white/[0.08] md:hover:bg-white/[0.13]"
                    : "text-ink-muted hover:text-ink md:bg-sunken md:hover:bg-mist",
                )}
              >
                <Search className="size-[18px] shrink-0" aria-hidden />
                <span className="hidden md:inline">Search events</span>
                <span className={cn("ml-auto hidden rounded-md px-1.5 py-0.5 text-[11px] font-semibold md:inline", dark ? "bg-white/10 text-white/70" : "bg-white text-ink-subtle shadow-[0_0_0_1px_#E5E7EB]")}>
                  Ctrl K
                </span>
              </button>
            )}

            {viewer ? (
              <>
                {ws === "host" ? (
                  <>
                    <Link href="/dashboard" className="hidden h-10 items-center gap-2 rounded-xl px-3 text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white xl:flex">
                      <ArrowLeftRight className="size-4" aria-hidden /> Switch to attending
                    </Link>
                    <Link
                      href="/organizer/events/new"
                      className="hidden h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-[14px] font-semibold text-white shadow-accent transition-colors hover:bg-accent-hover md:flex"
                    >
                      <Plus className="size-4" aria-hidden /> Create event
                    </Link>
                  </>
                ) : ws === "attend" ? (
                  <Link
                    href={viewer.isOrganizer ? "/organizer" : "/organizer/events/new"}
                    className="hidden h-10 items-center rounded-xl px-3 text-[14px] font-semibold text-ink transition-colors hover:bg-sunken xl:flex"
                  >
                    {viewer.isOrganizer ? "Switch to hosting" : "Host an event"}
                  </Link>
                ) : null}
                <NotificationBell tone={dark ? "dark" : "light"} />
                <AccountMenu viewer={viewer} ws={ws} dark={dark} onEnterCode={onEnterCode} />
              </>
            ) : (
              <>
                <Link href="/signin" className="hidden h-10 items-center rounded-xl px-3.5 text-[14px] font-semibold text-ink transition-colors hover:bg-sunken sm:flex">
                  Log in
                </Link>
                <Link
                  href="/signin?mode=signup"
                  className="hidden h-10 items-center rounded-xl bg-accent px-4 text-[14px] font-semibold text-white shadow-accent transition-colors hover:bg-accent-hover sm:flex"
                >
                  Get your pass
                </Link>
              </>
            )}

            <button
              onClick={() => setSheet(true)}
              aria-label="Open menu"
              aria-expanded={sheet}
              className={cn("grid size-10 place-items-center rounded-xl transition-colors lg:hidden", dark ? "hover:bg-white/[0.08]" : "hover:bg-sunken")}
            >
              <Menu className="size-[20px]" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      {sheet && <MenuSheet viewer={viewer} ws={ws} pathname={pathname} onClose={() => setSheet(false)} onEnterCode={onEnterCode} />}
    </>
  );
}

function BarLink({ href, active, dark, children }: { href: string; active: boolean; dark: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center rounded-xl px-3.5 text-[14.5px] font-semibold transition-colors duration-fast",
        dark
          ? active
            ? "bg-white/[0.12] text-white"
            : "text-white/65 hover:bg-white/[0.06] hover:text-white"
          : active
            ? "bg-sunken text-ink"
            : "text-ink-muted hover:bg-sunken/70 hover:text-ink",
      )}
    >
      {children}
    </Link>
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

function MoreMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  useEffect(() => setOpen(false), [pathname]);
  const active = items.some((i) => isActive(pathname, i));
  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex h-10 items-center gap-1 rounded-xl px-3.5 text-[14.5px] font-semibold transition-colors duration-fast",
          active ? "bg-sunken text-ink" : "text-ink-muted hover:bg-sunken/70 hover:text-ink",
        )}
      >
        More <ChevronDown className={cn("size-4 transition-transform duration-base", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-12 w-60 origin-top-left rounded-2xl bg-white p-1.5 shadow-pop motion-safe:animate-scale-in">
          {items.map((i) => (
            <Link
              key={i.href}
              role="menuitem"
              href={i.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
            >
              <i.icon className="size-[18px] text-ink-subtle" aria-hidden />
              {i.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" href="/get-app" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink">
            <Download className="size-[18px] text-ink-subtle" aria-hidden />
            Get the app
          </Link>
        </div>
      )}
    </div>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-[#2C3E5C] font-semibold text-white", className)}>
      {initials(name)}
    </span>
  );
}

function AccountMenu({ viewer, ws, dark, onEnterCode }: { viewer: NavViewer; ws: Workspace; dark: boolean; onEnterCode: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useDismiss(open, () => setOpen(false));
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink";

  return (
    <div ref={box} className="relative max-md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex h-10 items-center gap-2 rounded-xl pl-1 pr-2.5 transition-colors duration-fast",
          dark ? "hover:bg-white/[0.08]" : "hover:bg-sunken",
          open && (dark ? "bg-white/[0.08]" : "bg-sunken"),
        )}
      >
        <Avatar name={viewer.name} className="size-8 text-[12px]" />
        <ChevronDown className={cn("size-4 transition-transform duration-base", dark ? "text-white/70" : "text-ink-subtle", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-72 origin-top-right rounded-2xl bg-white p-1.5 text-ink shadow-pop motion-safe:animate-scale-in">
          <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
            <Avatar name={viewer.name} className="size-10 text-[13px]" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{viewer.name}</p>
              <p className="truncate text-[13px] text-ink-subtle">{viewer.email}</p>
            </div>
          </div>
          <div className="mb-1 h-px bg-line" />
          {ws === "attend" ? (
            <Link role="menuitem" href={viewer.isOrganizer ? "/organizer" : "/organizer/events/new"} className={item}>
              <ArrowLeftRight className="size-[18px] text-ink-subtle" aria-hidden />
              {viewer.isOrganizer ? "Switch to hosting" : "Host an event"}
            </Link>
          ) : (
            <Link role="menuitem" href="/dashboard" className={item}>
              <ArrowLeftRight className="size-[18px] text-ink-subtle" aria-hidden />
              Switch to attending
            </Link>
          )}
          {viewer.isAdmin && ws !== "admin" && (
            <Link role="menuitem" href="/admin" className={item}>
              <ShieldCheck className="size-[18px] text-ink-subtle" aria-hidden />
              Admin
            </Link>
          )}
          <Link role="menuitem" href="/profile" className={item}>
            <UserRound className="size-[18px] text-ink-subtle" aria-hidden />
            Profile
          </Link>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEnterCode();
            }}
            className={item}
          >
            <KeyRound className="size-[18px] text-ink-subtle" aria-hidden />
            Enter an event code
          </button>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" onClick={logout} className={item}>
            <LogOut className="size-[18px] text-ink-subtle" aria-hidden />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuSheet({
  viewer,
  ws,
  pathname,
  onClose,
  onEnterCode,
}: {
  viewer: NavViewer | null;
  ws: Workspace;
  pathname: string;
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

  const nav = viewer ? (ws === "host" ? HOST_NAV : ATTEND_NAV) : PUBLIC_LINKS.map((l) => ({ ...l, icon: null }));

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-white text-ink motion-safe:animate-fade-in lg:hidden">
      <div className="flex h-16 shrink-0 items-center justify-between px-gutter">
        <BrandLogo className="text-[23px]" />
        <button onClick={onClose} aria-label="Close menu" className="grid size-10 place-items-center rounded-xl hover:bg-sunken">
          <X className="size-[20px]" aria-hidden />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-gutter pb-8 pt-4">
        {viewer && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-sunken p-3">
            <Avatar name={viewer.name} className="size-11 text-[14px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold">{viewer.name}</p>
              <p className="truncate text-[13px] text-ink-subtle">{viewer.email}</p>
            </div>
            <Link href="/profile" className="rounded-[10px] px-3 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:bg-white">
              Profile
            </Link>
          </div>
        )}
        <ul>
          {nav.map((l, i) => {
            const active = "exact" in l ? isActive(pathname, l as NavItem) : pathname === l.href;
            return (
              <li key={l.href} className="motion-safe:animate-rise" style={{ animationDelay: `${40 + i * 30}ms` }}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-[60px] items-center justify-between border-b border-line font-display text-[28px] font-medium tracking-[-0.02em]"
                >
                  {l.label}
                  {active && <span className="size-2 rounded-full bg-accent" aria-hidden />}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 grid gap-2">
          {viewer ? (
            <>
              {ws === "host" ? (
                <>
                  <Link href="/organizer/events/new" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-white">
                    <Plus className="size-4" aria-hidden /> Create event
                  </Link>
                  <Link href="/dashboard" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong text-[15px] font-semibold">
                    Switch to attending
                  </Link>
                </>
              ) : (
                <Link href={viewer.isOrganizer ? "/organizer" : "/organizer/events/new"} className="flex h-12 items-center justify-center rounded-xl border border-line-strong text-[15px] font-semibold">
                  {viewer.isOrganizer ? "Switch to hosting" : "Host an event"}
                </Link>
              )}
              <button
                onClick={() => {
                  onClose();
                  onEnterCode();
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong text-[15px] font-semibold"
              >
                <KeyRound className="size-4" aria-hidden /> Enter an event code
              </button>
              {viewer.isAdmin && (
                <Link href="/admin" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong text-[15px] font-semibold">
                  <ShieldCheck className="size-4" aria-hidden /> Admin
                </Link>
              )}
              <button onClick={logout} className="mt-2 h-12 text-[15px] font-semibold text-ink-muted">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin?mode=signup" className="flex h-12 items-center justify-center rounded-xl bg-accent text-[15px] font-semibold text-white">
                Get your pass
              </Link>
              <Link href="/signin" className="flex h-12 items-center justify-center rounded-xl border border-line-strong text-[15px] font-semibold">
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
