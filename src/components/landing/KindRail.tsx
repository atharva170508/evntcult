"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { m } from "motion/react";
import { EASE } from "@/components/motion/MotionProvider";

const KINDS: { key: string; label: string; href: string }[] = [
  { key: "", label: "All", href: "/events" },
  { key: "TECH", label: "Tech", href: "/events?type=TECH" },
  { key: "CULTURAL", label: "Cultural", href: "/events?type=CULTURAL" },
  { key: "SPORTS", label: "Sports", href: "/events?type=SPORTS" },
  { key: "GAMING", label: "Gaming", href: "/events?type=GAMING" },
  { key: "WORKSHOP", label: "Workshops", href: "/events?type=WORKSHOP" },
  { key: "TALK", label: "Talks", href: "/events?type=TALK" },
  { key: "PARTY", label: "Parties", href: "/events?type=PARTY" },
  { key: "free", label: "Free", href: "/events?price=free" },
];

/** Minimal editorial category rail: uppercase tracked labels with champagne-gold underline. */
export function KindRail() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current =
    pathname === "/events"
      ? (params.get("type") ?? (params.get("price") === "free" ? "free" : ""))
      : null;

  return (
    <nav
      aria-label="Browse by category"
      className="no-scrollbar flex gap-7 overflow-x-auto md:gap-9"
    >
      {KINDS.map((k) => {
        const active = current === k.key;
        return (
          <Link
            key={k.label}
            href={k.href}
            aria-current={active ? "true" : undefined}
            className={cn(
              "tr-meta relative inline-flex min-h-[48px] shrink-0 items-center transition-colors",
              active ? "text-[#D4B87A]" : "text-ink-muted hover:text-ink",
            )}
          >
            {k.label}
            {active && (
              <m.span
                layoutId="kind-underline"
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#D4B87A]"
                transition={{ duration: 0.25, ease: EASE }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
