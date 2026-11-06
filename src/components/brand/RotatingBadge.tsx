import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Circular "GET YOUR PASS" sticker that slowly spins (EventX "Book a seat" idea). */
export function RotatingBadge({ href, label, text = "GET YOUR PASS • WALK IN • " }: { href: string; label: string; text?: string }) {
  return (
    <Link href={href} aria-label={label} className="group relative grid size-[132px] shrink-0 place-items-center rounded-full bg-volt text-ink-inverse shadow-[0_20px_60px_-20px_rgba(212,255,58,0.6)] transition-transform hover:scale-105">
      <svg viewBox="0 0 132 132" className="absolute inset-0 size-full motion-safe:animate-spin-slow" aria-hidden>
        <defs>
          <path id="badge-circle" d="M66,66 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" />
        </defs>
        <text className="fill-current font-display text-[11.5px] font-bold uppercase tracking-[0.14em]">
          <textPath href="#badge-circle" textLength="296" lengthAdjust="spacing">{text}</textPath>
        </text>
      </svg>
      <span className="grid size-12 place-items-center rounded-full bg-ink-inverse text-volt transition-transform group-hover:rotate-45">
        <ArrowUpRight className="size-6" aria-hidden />
      </span>
    </Link>
  );
}
