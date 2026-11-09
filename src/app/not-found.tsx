import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="text-center">
        <p className="shout text-volt text-[clamp(96px,18vw,220px)]">404</p>
        <h1 className="title-xl mt-2 text-[clamp(36px,5vw,64px)]">This page doesn&apos;t <em className="text-volt">exist</em></h1>
        <Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-volt px-6 py-3.5 text-[15px] font-bold text-ink-inverse hover:bg-volt-hover">
          Back to home
        </Link>
      </div>
    </main>
  );
}
