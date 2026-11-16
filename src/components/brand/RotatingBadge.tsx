import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Circular ink sticker with slowly turning mono text. */
export function RotatingBadge({ href, label, text = "GET YOUR PASS • WALK IN • " }: { href: string; label: string; text?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group relative grid size-[120px] shrink-0 place-items-center rounded-full bg-ink text-white shadow-raised transition-transform duration-base ease-out hover:scale-[1.04]"
    >
      <svg viewBox="0 0 132 132" className="absolute inset-0 size-full motion-safe:animate-[spin_24s_linear_infinite]" aria-hidden>
        <defs>
          <path id="badge-circle" d="M66,66 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" />
        </defs>
        <text className="fill-current font-mono text-[10.5px] font-medium uppercase tracking-[0.18em]">
          <textPath href="#badge-circle" textLength="296" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="grid size-11 place-items-center rounded-full bg-accent text-white transition-transform duration-base ease-out group-hover:rotate-45">
        <ArrowUpRight className="size-5" aria-hidden />
      </span>
    </Link>
  );
}
