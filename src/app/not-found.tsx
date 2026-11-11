import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <p className="shout text-volt text-display">404</p>
        <h1 className="title-xl mt-2 text-display">This page doesn&apos;t <em className="text-volt">exist</em></h1>
        <Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-volt px-6 py-4 text-body font-semibold text-ink-inverse hover:bg-volt-hover">
          Back to home
        </Link>
      </div>
    </main>
  );
}
