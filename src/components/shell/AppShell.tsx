"use client";

import { useState } from "react";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { TopBar, type NavViewer } from "./TopBar";

/**
 * Signed in: sidebar + glass header + phone tabs. Signed out: marketing header only.
 * Both share the footer and the code dialog.
 */
export function AppShell({ viewer, children }: { viewer: NavViewer | null; children: React.ReactNode }) {
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <div className="flex min-h-dvh overflow-x-clip">
      {viewer && <Sidebar isOrganizer={!!viewer.isOrganizer} onEnterCode={() => setCodeOpen(true)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar viewer={viewer} onEnterCode={() => setCodeOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-shell flex-1 px-gutter pb-8">
          {children}
        </main>
        <Footer viewer={viewer} />
      </div>
      {viewer && <MobileTabBar isOrganizer={!!viewer.isOrganizer} />}
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
