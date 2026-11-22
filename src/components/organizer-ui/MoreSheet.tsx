"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Copy, Eye, MoreHorizontal, Pencil, ScanLine, Share2, Users } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";

const ICONS = { camera: Camera, copy: Copy, eye: Eye, pencil: Pencil, scan: ScanLine, share: Share2, users: Users };
export type MoreIcon = keyof typeof ICONS;

export interface MoreItem {
  label: string;
  icon: MoreIcon;
  href?: string;
  onSelect?: () => void;
}

/** Phones: the secondary page actions behind one round button, opening a sheet from the bottom. */
export function MoreSheet({ title, items }: { title: string; items: MoreItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const row = "flex min-h-[54px] w-full items-center gap-3.5 text-left text-[16px] text-ink active:opacity-60";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More actions"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink active:scale-95 md:hidden"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </button>
      {open && (
        <BottomSheet label="More actions" title={title} onClose={() => setOpen(false)}>
          <ul className="divide-y divide-line">
            {items.map((it) => {
              const Icon = ICONS[it.icon];
              const body = (
                <>
                  <Icon className="size-[20px] text-ink-muted" aria-hidden /> {it.label}
                </>
              );
              return (
                <li key={it.label}>
                  {it.href ? (
                    <Link href={it.href} className={row} onClick={() => setOpen(false)}>
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={row}
                      onClick={() => {
                        setOpen(false);
                        it.onSelect?.();
                      }}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </BottomSheet>
      )}
    </>
  );
}
