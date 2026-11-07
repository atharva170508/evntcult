"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HostEventModal } from "@/components/events/HostEventModal";
import { Wordmark } from "@/components/brand/Wordmark";
import { EnterCodeDialog } from "./EnterCodeDialog";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { TopBar, type NavViewer } from "./TopBar";

/** Sidebar + top bar + phone tabs around every app page. */
export function AppShell({ viewer, children }: { viewer: NavViewer | null; children: React.ReactNode }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);
  const router = useRouter();

  // "Host an event" from the landing page sends people through sign-in to /dashboard?host=1.
  useEffect(() => {
    if (!viewer) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("host") === "1") {
      setHostOpen(true);
      url.searchParams.delete("host");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, [viewer]);

  return (
    <div className="flex min-h-dvh">
      {/* Signed-out visitors get a landing-page top nav instead of the app sidebar. */}
      {viewer && <Sidebar isOrganizer={!!viewer.isOrganizer} signedIn onEnterCode={() => setCodeOpen(true)} onHost={() => setHostOpen(true)} />}
      <div className="min-w-0 flex-1">
        <TopBar viewer={viewer} onEnterCode={() => setCodeOpen(true)} onHost={() => setHostOpen(true)} />
        <main className="mx-auto max-w-[1280px] px-4 pb-32 md:pb-16 lg:px-8">{children}</main>
        <footer className="print:hidden mx-auto max-w-[1280px] px-4 pb-28 pt-10 text-[12.5px] text-ink-subtle md:pb-10 lg:px-8">
          <Wordmark />
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-line pt-6">
            <span>EvntCult · Every campus event, one place</span>
            <span>Made for campus life</span>
          </div>
        </footer>
      </div>


      {viewer && <MobileTabBar isOrganizer={!!viewer.isOrganizer} />}
      <EnterCodeDialog open={codeOpen} onClose={() => setCodeOpen(false)} />
      {viewer && (
        <HostEventModal
          open={hostOpen}
          onClose={() => setHostOpen(false)}
          onCreated={({ slug }) => {
            setHostOpen(false);
            router.push(`/e/${slug}`);
            router.refresh(); // you may have just become an organizer: reload the menu
          }}
        />
      )}
    </div>
  );
}
