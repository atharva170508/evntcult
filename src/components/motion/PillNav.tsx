"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type PillItem = { href: string; label: string; active: boolean };

/** Filter chips / tabs where the selected pill slides between options. */
export function PillNav({ items, id, className, label }: { items: PillItem[]; id: string; className?: string; label: string }) {
  return (
    <nav aria-label={label} className={cn("no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5", className)}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          scroll={false}
          aria-current={it.active ? "true" : undefined}
          className={cn(
            "relative inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
            it.active ? "border-transparent text-ink-contrast" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
          )}
        >
          {it.active && (
            <motion.span layoutId={`pill-${id}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", bounce: 0.18, duration: 0.45 }} />
          )}
          <span className="relative">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
