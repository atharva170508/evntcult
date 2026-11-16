import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { LogoWordmark } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex min-h-dvh flex-col px-gutter py-6">
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,black,transparent_75%)]" />
      <Link href="/dashboard" aria-label="EvntCult home" className="w-fit">
        <LogoWordmark motion="blink" className="text-[24px]" />
      </Link>
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center">
        <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-subtle">Error 404</p>
        <h1 className="mt-5 text-display-xl font-semibold">
          This page doesn&apos;t <em>exist.</em>
        </h1>
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
