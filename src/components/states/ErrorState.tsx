"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

/** §14 error state: what happened, in a sentence, and the two ways out. A decision, so never a toast. */
export function ErrorState({ reset, home }: { reset: () => void; home: string }) {
  return (
    <section role="alert" className="flex max-w-prose flex-col items-start gap-3 border-y border-line py-8">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="title-xl">This page didn&apos;t load.</h1>
      <p className="text-body text-ink-muted">Nothing you entered was lost. Try again, and if it keeps happening, check your connection.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={buttonClass("secondary")}>
          Try again
        </button>
        <Link href={home} className={buttonClass("ghost")}>
          <span aria-hidden>←</span> Home
        </Link>
      </div>
    </section>
  );
}
