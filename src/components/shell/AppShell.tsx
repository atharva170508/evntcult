"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { TopBar, type NavViewer } from "./TopBar";

/** Sidebar + top bar + phone tabs around every app page. */
export function AppShell({ viewer, children }: { viewer: NavViewer | null; children: React.ReactNode }) {
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <Sidebar isOrganizer={!!viewer?.isOrganizer} signedIn={!!viewer} onEnterCode={() => setCodeOpen(true)} />
      <div className="min-w-0 flex-1">
        <TopBar viewer={viewer} onEnterCode={() => setCodeOpen(true)} />
        <main className="mx-auto max-w-[1280px] px-4 pb-32 md:pb-16 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-[1280px] px-4 pb-28 text-[12.5px] text-ink-subtle md:pb-10 lg:px-8">
          <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-6">
            <span>EvntCult · Every campus event, one place</span>
            <span>Made for campus life</span>
          </div>
        </footer>
      </div>

      {/* Campus WhatsApp channel (KonfHub idea, made for Indian students). */}
      <a
        href="https://whatsapp.com/channel/"
        target="_blank"
        rel="noreferrer"
        className="group fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-[#25d366] py-3 pl-3 pr-3 text-[13px] font-bold text-ink-inverse shadow-pop transition-all hover:pr-4 md:bottom-6 md:right-6"
        aria-label="Get updates on WhatsApp"
      >
        <MessageCircle className="size-5" />
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap transition-[max-width] duration-300 group-hover:max-w-[160px] md:inline">
          Updates on WhatsApp
        </span>
      </a>

      <MobileTabBar isOrganizer={!!viewer?.isOrganizer} />
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
