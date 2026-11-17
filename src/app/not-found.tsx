import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { LogoWordmark } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex min-h-dvh flex-col px-gutter py-6">
      <Link href="/dashboard" aria-label="EvntCult home" className="w-fit">
        <LogoWordmark className="text-[23px]" />
      </Link>
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center">
        <p className="inline-flex items-center gap-3 rounded-xl bg-night px-4 py-2 font-mono text-[14px] tracking-[0.06em] text-[#E9CF94]">
          GATE 404 <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-normal text-white/70">Not found</span>
        </p>
        <h1 className="mt-7 text-display-xl font-medium">This gate doesn&apos;t exist.</h1>
        <p className="mt-4 max-w-[40ch] text-lead text-ink-muted">The page may have moved, or the link has a typo. Everything else is right where you left it.</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className={buttonClass("primary", "lg")}>
            <ArrowLeft className="size-4" aria-hidden /> Back to home
          </Link>
          <Link href="/events" className={buttonClass("secondary", "lg")}>
            <Compass className="size-4" aria-hidden /> Discover events
          </Link>
        </div>
      </div>
    </main>
  );
}
