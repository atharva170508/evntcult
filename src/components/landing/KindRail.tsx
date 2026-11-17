"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Cpu, Drama, Gamepad2, LayoutGrid, Mic, PartyPopper, Ticket, Trophy, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS: { key: string; label: string; icon: LucideIcon; href: string }[] = [
  { key: "", label: "All", icon: LayoutGrid, href: "/events" },
  { key: "TECH", label: "Tech", icon: Cpu, href: "/events?type=TECH" },
  { key: "CULTURAL", label: "Cultural", icon: Drama, href: "/events?type=CULTURAL" },
  { key: "SPORTS", label: "Sports", icon: Trophy, href: "/events?type=SPORTS" },
  { key: "GAMING", label: "Gaming", icon: Gamepad2, href: "/events?type=GAMING" },
  { key: "WORKSHOP", label: "Workshops", icon: Wrench, href: "/events?type=WORKSHOP" },
  { key: "TALK", label: "Talks", icon: Mic, href: "/events?type=TALK" },
  { key: "PARTY", label: "Parties", icon: PartyPopper, href: "/events?type=PARTY" },
  { key: "free", label: "Free", icon: Ticket, href: "/events?price=free" },
];

/** Category bar: icon over label, dark underline on the current one. */
export function KindRail() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/events" ? (params.get("type") ?? (params.get("price") === "free" ? "free" : "")) : null;

  return (
    <nav aria-label="Browse by kind" className="no-scrollbar -mx-gutter flex gap-8 overflow-x-auto px-gutter sm:mx-0 sm:px-0 md:gap-10">
      {KINDS.map((k) => {
        const active = current === k.key;
        return (
          <Link
            key={k.label}
            href={k.href}
            aria-current={active ? "true" : undefined}
            className={cn(
              "group relative flex shrink-0 flex-col items-center gap-2 pb-3 pt-4 text-[12.5px] font-semibold transition-colors",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            <k.icon className="size-6" strokeWidth={1.6} aria-hidden />
            {k.label}
            <span
              aria-hidden
              className={cn("absolute inset-x-0 bottom-0 h-[2px] bg-ink transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:bg-line-strong group-hover:opacity-100")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
