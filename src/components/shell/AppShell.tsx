"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteHeader, type NavViewer } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SearchDialog } from "@/components/site/SearchDialog";
import { TabBar } from "@/components/site/TabBar";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { SheenTracker } from "@/components/ui/SheenTracker";
import { BackToTop } from "@/components/ui/BackToTop";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { workspaceFor } from "./nav";
import { AutoBack, onPopState, trackNavigation } from "./BackButton";

export type { NavViewer };

/**
 * The frame around every page: one header bar, the page, the footer on attendee and public
 * pages, and the phone tab bar. For the logged-out public landing page (/dashboard), renders
 * a dedicated full-width Obsidian Twilight shell with zero light-chrome clashes.
 */
export function AppShell({
  viewer,
  children,
  wide = false,
}: {
  viewer: NavViewer | null;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const ws = workspaceFor(pathname);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setSearchOpen(false), [pathname]);

  // In-app history depth, so the top-left Back can go back like a native app.
  const firstNav = useRef(true);
  useEffect(() => {
    trackNavigation(firstNav.current);
    firstNav.current = false;
  }, [pathname]);
  useEffect(() => {
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const isPublicCinema = !viewer && pathname === "/dashboard";

  if (isPublicCinema) {
    return (
      <div className="flex min-h-dvh w-full flex-col overflow-x-clip bg-[#121110] text-[#EDE3DA]">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <OfflineBanner />
        <main id="main" className="w-full flex-1">
          {children}
        </main>
        <BackToTop />
        <SearchDialog open={searchOpen} onClose={closeSearch} isOrganizer={false} />
        <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
        <KeyboardShortcuts
          isOrganizer={false}
          signedIn={false}
          onEnterCode={() => setCodeOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <OfflineBanner />
      <SheenTracker />
      <SiteHeader viewer={viewer} wide={wide} onSearch={() => setSearchOpen(true)} onEnterCode={() => setCodeOpen(true)} />
      <main
        id="main"
        className={cn(
          "mx-auto w-full flex-1 px-gutter pb-[calc(112px+env(safe-area-inset-bottom))] md:pb-12",
          wide ? "max-w-[1440px]" : "max-w-[1360px]",
        )}
      >
        <AutoBack pathname={pathname} />
        {children}
      </main>
      {ws !== "admin" && <SiteFooter viewer={viewer} />}
      <TabBar signedIn={!!viewer} />
      <BackToTop />
      <SearchDialog open={searchOpen} onClose={closeSearch} isOrganizer={!!viewer?.isOrganizer} onEnterCode={viewer ? () => setCodeOpen(true) : undefined} />
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
      <KeyboardShortcuts
        isOrganizer={!!viewer?.isOrganizer}
        signedIn={!!viewer}
        onEnterCode={() => setCodeOpen(true)}
      />
    </div>
  );
}
