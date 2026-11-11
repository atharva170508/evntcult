import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-prose flex-col justify-center px-4">
      <p className="eyebrow">404</p>
      <h1 className="title-xl mt-2">This page doesn&apos;t exist.</h1>
      <p className="mt-2 text-body text-ink-muted">The link may be old, or the event may have been unpublished.</p>
      <Link href="/dashboard" className={buttonClass("secondary", "md", "mt-8 w-fit")}>
        <span aria-hidden>←</span> Back to home
      </Link>
    </main>
  );
}
