import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="text-center">
        <p className="font-mono text-[64px] font-bold leading-none text-sun">404</p>
        <h1 className="headline mt-3 text-[26px]">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-[15px] text-ink-muted">The link may be old, or the event was removed.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-ink-inverse hover:bg-ink-2">
          Back to home
        </Link>
      </div>
    </main>
  );
}
