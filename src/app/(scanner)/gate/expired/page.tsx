import type { Metadata } from "next";
import { Link2Off } from "lucide-react";

export const metadata: Metadata = { title: "Link expired", robots: { index: false } };

export default function GateExpired() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <span className="grid size-12 place-items-center rounded-full bg-white/10">
        <Link2Off className="size-6 text-white/80" aria-hidden />
      </span>
      <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.03em]">This volunteer link has ended.</h1>
      <p className="text-[15px] text-white/65">It expired or the organizer turned it off. Ask them to send you a new link, then open it on this phone.</p>
    </main>
  );
}
