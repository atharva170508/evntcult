"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

/**
 * When a page crashes. Says what happened in plain words, offers a retry (most errors here are a
 * dropped connection), and shows a short reference to quote if it keeps happening.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return (
    <main id="main" className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-gutter py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-sunken text-[26px]" aria-hidden>
        {offline ? "📶" : "🎟️"}
      </span>
      <h1 className="mt-6 font-display text-[clamp(34px,5vw,48px)] leading-none tracking-[-0.03em] text-ink">
        {offline ? "You're offline." : "That didn't load."}
      </h1>
      <p className="mt-4 max-w-[40ch] text-[16.5px] leading-relaxed text-ink-2">
        {offline
          ? "Your passes still work at the gate. Reconnect to see everything else."
          : "Something went wrong on our side. Try again; if it keeps happening, tell the organizer the reference below."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={buttonClass("primary", "lg")}>
          <RotateCcw className="size-4" aria-hidden /> Try again
        </button>
        <Link href="/passes" className={buttonClass("secondary", "lg")}>
          Open my passes
        </Link>
      </div>
      {error.digest && <p className="mt-8 font-mono text-[12px] text-ink-subtle">Reference {error.digest}</p>}
    </main>
  );
}
