"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { Footer } from "./Footer";
import { Header, type NavViewer } from "./Header";
import { workspaceFor } from "./nav";

export type { NavViewer };

/**
 * One frame for every signed-in and public page: two-tier header, centred content column,
 * footer on attendee/public pages, phone tab bar. Host and Admin pages use the same frame
 * so the whole product feels like one app.
 */
export function AppShell({ viewer, children, wide = false }: { viewer: NavViewer | null; children: React.ReactNode; wide?: boolean }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const ws = workspaceFor(usePathname());

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <Header viewer={viewer} wide={wide} onEnterCode={() => setCodeOpen(true)} />
      <main id="main" className={cn("mx-auto w-full flex-1 px-gutter pb-24 md:pb-12", wide ? "max-w-[1440px]" : "max-w-shell")}>
        {children}
      </main>
      {ws === "attend" && <Footer viewer={viewer} />}
      {viewer && <BottomNav />}
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
