import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Circular "GET YOUR PASS" sticker that slowly spins (EventX "Book a seat" idea). */
export function RotatingBadge({ href, label, text = "GET YOUR PASS • WALK IN • " }: { href: string; label: string; text?: string }) {
  return (
    <Link href={href} aria-label={label} className="group relative grid size-[132px] shrink-0 place-items-center rounded-full bg-volt text-ink-inverse transition-transform hover:scale-105">
      <svg viewBox="0 0 132 132" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <path id="badge-circle" d="M66,66 m-32,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" />
        </defs>
        <text className="fill-current font-display text-caption font-semibold uppercase tracking-[0.12em]">
          <textPath href="#badge-circle" textLength="296" lengthAdjust="spacing">{text}</textPath>
        </text>
      </svg>
      <span className="grid size-12 place-items-center rounded-full bg-ink-inverse text-volt transition-transform group-hover:rotate-45">
        <ArrowUpRight className="size-6" aria-hidden />
      </span>
    </Link>
  );
}
