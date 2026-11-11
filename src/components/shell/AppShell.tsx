"use client";
import Link from "next/link";

import { useState } from "react";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { TopBar, type NavViewer } from "./TopBar";

/** Sidebar + top bar + phone tabs around every app page. */
export function AppShell({ viewer, children }: { viewer: NavViewer | null; children: React.ReactNode }) {
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Signed-out visitors get a landing-page top nav instead of the app sidebar. */}
      {viewer && <Sidebar isOrganizer={!!viewer.isOrganizer} signedIn onEnterCode={() => setCodeOpen(true)} />}
      <div className="min-w-0 flex-1">
        <TopBar viewer={viewer} onEnterCode={() => setCodeOpen(true)} />
        <main id="main" tabIndex={-1} className="mx-auto max-w-app px-4 pb-24 lg:px-8 lg:pb-16">{children}</main>
        <footer className="mx-auto flex max-w-app flex-wrap justify-between gap-2 border-t border-line px-4 pb-24 pt-6 text-label text-ink-subtle print:hidden lg:px-8 lg:pb-8">
          <span>EvntCult · Every event, one place</span>
          <span className="flex gap-4">
            <Link href="/get-app" className="inline-flex min-h-6 items-center underline-offset-4 hover:text-ink hover:underline">
              Get the app
            </Link>
            <span>Made by Atharva, Nakul and Abhay</span>
          </span>
        </footer>
      </div>


      {viewer && <MobileTabBar isOrganizer={!!viewer.isOrganizer} />}
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
