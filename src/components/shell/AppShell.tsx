"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteHeader, type NavViewer } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SearchDialog } from "@/components/site/SearchDialog";
import { TabBar } from "@/components/site/TabBar";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { workspaceFor } from "./nav";

export type { NavViewer };

/**
 * The frame around every page: one header bar, the page, the footer on attendee and public
 * pages, and the phone tab bar for signed-in people. Pages that need full-width bands
 * break out of the column with the `.bleed` class.
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
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
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

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SiteHeader viewer={viewer} wide={wide} onSearch={() => setSearchOpen(true)} onEnterCode={() => setCodeOpen(true)} />
      <main
        id="main"
        className={cn("mx-auto w-full flex-1 px-gutter pb-28 md:pb-12", wide ? "max-w-[1440px]" : "max-w-shell")}
      >
        {children}
      </main>
      {ws === "attend" && <SiteFooter viewer={viewer} />}
      {viewer && <TabBar />}
      <SearchDialog open={searchOpen} onClose={closeSearch} />
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
