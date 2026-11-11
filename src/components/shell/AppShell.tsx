"use client";
import Link from "next/link";

import { useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
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
        <main className="mx-auto max-w-[1280px] px-4 pb-32 md:pb-16 lg:px-8">{children}</main>
        <footer className="print:hidden mx-auto max-w-[1280px] px-4 pb-32 pt-12 text-label text-ink-subtle md:pb-12 lg:px-8">
          <Wordmark />
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-line pt-6">
            <span>EvntCult · Every event, one place</span>
            <span>Made by Atharva, Nakul and Abhay ♥</span>
          </div>
          <Link href="/get-app" className="mt-2 inline-block font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline">Get the app</Link>
        </footer>
      </div>


      {viewer && <MobileTabBar isOrganizer={!!viewer.isOrganizer} />}
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
