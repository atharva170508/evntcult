"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, KeyRound, LogOut, Menu, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { LogoIcon, LogoWordmark } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";
import { NotificationBell } from "./NotificationBell";
import { PUBLIC_NAV, isActive, navFor, workspaceFor, type Workspace } from "./nav";

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

/**
 * Two-tier product header (Vercel / Linear pattern):
 *   1. Utility bar — logo, workspace switch, search, notifications, account.
 *   2. Section tabs — the current workspace's pages, with a sliding underline.
 * Signed-out visitors get a single marketing bar. Phones get a drawer plus the bottom tab bar.
 */
export function Header({ viewer, onEnterCode, wide = false }: { viewer: NavViewer | null; onEnterCode: () => void; wide?: boolean }) {
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Publish the real header height so sticky sub-headers sit flush under it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchRef.current && searchRef.current.offsetParent !== null) searchRef.current.focus();
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
        ref={headerRef}
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-base ease-out print:hidden",
          scrolled ? "glass border-line shadow-[0_8px_24px_-20px_rgba(17,17,16,0.35)]" : "border-line bg-canvas",
        )}
      >
        {/* Tier 1 — utility bar */}
        <div className={cn("mx-auto flex h-14 items-center gap-3 px-gutter", wide ? "max-w-[1440px]" : "max-w-shell")}>
          <Link href={ws === "host" ? "/organizer" : "/dashboard"} className="flex shrink-0 items-center" aria-label="EvntCult home">
            <LogoWordmark motion="blink" className="text-[23px] text-ink" />
          </Link>

          {viewer && (
            <>
              <span className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden />
              <WorkspaceSwitch ws={ws} viewer={viewer} className="hidden sm:flex" />
            </>
          )}

          {!viewer && (
            <nav className="ml-4 hidden items-center gap-0.5 md:flex" aria-label="Main">
              {PUBLIC_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors duration-fast",
                    pathname === l.href ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {viewer && ws === "attend" && <SearchField inputRef={searchRef} className="mr-1 hidden lg:flex" />}
            {viewer ? (
              <>
                {ws === "attend" && (
                  <button onClick={onEnterCode} className={buttonClass("ghost", "sm", "hidden md:inline-flex")}>
                    <KeyRound className="size-3.5" aria-hidden /> Code
                  </button>
                )}
                <NotificationBell />
                <AccountMenu viewer={viewer} />
              </>
            ) : (
              <>
                <Link href="/signin" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
                  Log in
                </Link>
                <Link href="/signin?mode=signup" className={buttonClass("primary", "sm")}>
                  Get started
                </Link>
              </>
            )}
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              aria-expanded={drawer}
              className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.05] md:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>

        {/* Tier 2 — section tabs */}
        {viewer && <SectionTabs ws={ws} pathname={pathname} wide={wide} />}
      </header>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} viewer={viewer} ws={ws} onEnterCode={onEnterCode} pathname={pathname} />
    </>
  );
}

/* ── Workspace switch ───────────────────────────────────── */

function WorkspaceSwitch({ ws, viewer, className }: { ws: Workspace; viewer: NavViewer; className?: string }) {
  const items: { key: Workspace; label: string; href: string }[] = [
    { key: "attend", label: "Attend", href: "/dashboard" },
    { key: "host", label: "Host", href: "/organizer" },
    ...(viewer.isAdmin ? [{ key: "admin" as const, label: "Admin", href: "/admin" }] : []),
  ];
  return (
    <nav aria-label="Workspace" className={cn("items-center rounded-full bg-sunken p-[3px]", className)}>
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          aria-current={ws === it.key ? "page" : undefined}
          className={cn(
            "rounded-full px-3 py-1 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-fast ease-out",
            ws === it.key ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

/* ── Section tabs with sliding underline ────────────────── */

function SectionTabs({ ws, pathname, wide }: { ws: Workspace; pathname: string; wide: boolean }) {
  const items = navFor(ws);
  const listRef = useRef<HTMLUListElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const activeIndex = items.findIndex((i) => isActive(pathname, i));

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const el = list.querySelector<HTMLElement>('[aria-current="page"]');
      setBar(el ? { left: el.offsetLeft + 10, width: el.offsetWidth - 20 } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, ws]);

  return (
    <div className={cn("mx-auto hidden h-11 items-stretch gap-4 px-gutter md:flex", wide ? "max-w-[1440px]" : "max-w-shell")}>
      <ul ref={listRef} className="no-scrollbar relative -ml-2.5 flex min-w-0 flex-1 items-stretch overflow-x-auto">
        {items.map((it) => {
          const active = isActive(pathname, it);
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "my-1.5 flex items-center rounded-lg px-2.5 text-[13.5px] font-medium transition-colors duration-fast",
                  active ? "text-ink" : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                )}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
        {bar && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-ink transition-[left,width] duration-slow ease-out"
            style={{ left: bar.left, width: bar.width }}
          />
        )}
      </ul>
      <div className="flex shrink-0 items-center gap-2">
        {ws === "host" && (
          // Full load on purpose: the editor swaps its URL to the draft after the first save.
          <Link href="/organizer/events/new" className={buttonClass("primary", "sm")}>
            <Plus className="size-3.5" aria-hidden /> Create event
          </Link>
        )}
        {ws === "attend" && (
          <Link href="/organizer" className="group inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink">
            Host an event <ArrowUpRight className="size-3.5 transition-transform duration-base ease-out group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Search ─────────────────────────────────────────────── */

function SearchField({ inputRef, className }: { inputRef?: React.RefObject<HTMLInputElement | null>; className?: string }) {
  return (
    <form
      action="/events"
      role="search"
      className={cn(
        "h-9 w-full items-center gap-2 rounded-full bg-sunken/80 pl-3 pr-1.5 ring-1 ring-inset ring-transparent transition-[background-color,box-shadow] duration-fast focus-within:bg-surface focus-within:shadow-card focus-within:ring-line lg:w-[300px]",
        className,
      )}
    >
      <Search className="size-[15px] shrink-0 text-ink-subtle" aria-hidden />
      <input
        ref={inputRef}
        name="q"
        type="search"
        placeholder="Search events"
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search events"
      />
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
        className="ml-1 flex h-9 items-center gap-1 rounded-full py-1 pl-1 pr-1.5 transition-colors hover:bg-ink/[0.05]"
      >
        <Avatar name={viewer.name} />
        <ChevronDown className={cn("size-3.5 text-ink-muted transition-transform duration-base ease-out", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-64 origin-top-right animate-scale-in rounded-card bg-surface p-1.5 shadow-pop">
          <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
            <Avatar name={viewer.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{viewer.name}</p>
              <p className="truncate text-[12.5px] text-ink-muted">{viewer.email}</p>
            </div>
          </div>
          <div className="h-px bg-line" />
          <MenuLink href="/profile" icon={UserRound} onClick={() => setOpen(false)}>
            Profile & settings
          </MenuLink>
          {viewer.isAdmin && (
            <MenuLink href="/admin" icon={ShieldCheck} onClick={() => setOpen(false)}>
              Admin
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

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-ink font-medium text-white", size === "lg" ? "size-9 text-[12.5px]" : "size-7 text-[11px]")} aria-hidden>
      {initials(name)}
    </span>
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
  ws,
  onEnterCode,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  viewer: NavViewer | null;
  ws: Workspace;
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

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Menu"
      className="ml-auto mr-0 h-dvh max-h-dvh w-[min(88vw,360px)] bg-canvas p-0 text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] open:animate-slide-in-right md:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <LogoIcon className="size-7" blink={false} />
          <button onClick={onClose} aria-label="Close menu" className="-mr-2 grid size-9 place-items-center rounded-full transition-colors hover:bg-ink/[0.05]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
          {viewer ? (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-sunken p-1">
                {(
                  [
                    ["attend", "Attend", "/dashboard"],
                    ["host", "Host", "/organizer"],
                  ] as const
                ).map(([key, label, href]) => (
                  <Link
                    key={key}
                    href={href}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-full text-[14px] font-medium",
                      ws === key ? "bg-surface text-ink shadow-card" : "text-ink-muted",
                    )}
                  >
                    {ws === key && <Check className="size-3.5" aria-hidden />} {label}
                  </Link>
                ))}
              </div>
              {ws === "attend" && <SearchField className="mt-4 flex h-11 w-full" />}
              <p className="eyebrow mb-2 mt-6">{ws === "host" ? "Hosting" : ws === "admin" ? "Admin" : "Menu"}</p>
              <ul className="space-y-0.5">
                {navFor(ws).map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn("flex h-12 items-center gap-3 rounded-xl px-3 text-[16px] font-medium transition-colors", active ? "bg-surface shadow-card" : "text-ink-2 hover:bg-ink/[0.04]")}
                      >
                        <item.icon className="size-5 text-ink-subtle" aria-hidden /> {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {ws === "host" && (
                <Link href="/organizer/events/new" className={buttonClass("primary", "lg", "mt-4 w-full")}>
                  <Plus className="size-4" aria-hidden /> Create event
                </Link>
              )}
            </>
          ) : (
            <ul>
              {PUBLIC_NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex h-14 items-center justify-between border-b border-line text-[22px] font-semibold tracking-tighter">
                    {l.label} <ArrowRight className="size-5 text-ink-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t border-line p-5">
          {viewer ? (
            <>
              {ws === "attend" && (
                <button
                  onClick={() => {
                    onClose();
                    onEnterCode();
                  }}
                  className={buttonClass("secondary", "lg", "w-full")}
                >
                  <KeyRound className="size-4" aria-hidden /> Enter event code
                </button>
              )}
              <div className="flex items-center gap-3 pt-1">
                <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-ink/[0.04]">
                  <Avatar name={viewer.name} size="lg" />
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
                Get started free
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
