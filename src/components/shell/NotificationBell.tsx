"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { relative } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";

interface Item {
  id: string;
  text: string;
  href: string;
  at: string;
  read: boolean;
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/notifications", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const data = (await res.json()) as { items: Item[]; unread: number };
    setItems(data.items);
    setUnread(data.unread);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function toggle() {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      setUnread(0);
      void fetch("/api/me/notifications", { method: "POST" }).catch(() => null);
    }
  }

  return (
    <div ref={box} className="sm:relative">
      <button onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} className={buttonClass("ghost", "sm", "gap-1 px-2")}>
        Updates
        {unread > 0 && <span className="font-mono text-caption text-ink">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div data-phase="in" className="ec-menu absolute inset-x-4 top-[56px] z-40 max-h-[70dvh] overflow-y-auto rounded-md border border-line-strong bg-surface-2 shadow-overlay sm:inset-x-auto sm:right-0 sm:top-[44px] sm:w-[340px]">
          {items.length === 0 ? (
            <p className="p-4 text-body-sm text-ink-muted">Nothing new. Updates from your events show up here.</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-white/[0.04]">
                    <span className={`block text-body-sm ${n.read ? "text-ink-muted" : "font-semibold"}`}>{n.text}</span>
                    <span className="mt-1 block font-mono text-caption text-ink-subtle">{relative(new Date(n.at))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
