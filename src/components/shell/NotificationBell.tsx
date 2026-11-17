"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { relative } from "@/lib/utils";

interface Item {
  id: string;
  text: string;
  href: string;
  at: string;
  read: boolean;
}

export function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
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
      <button onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} className={`relative grid size-10 place-items-center rounded-xl transition-colors duration-fast ${tone === "dark" ? "text-white/80 hover:bg-white/[0.08] hover:text-white aria-expanded:bg-white/[0.1]" : "text-ink-2 hover:bg-sunken hover:text-ink aria-expanded:bg-sunken"}`}>
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-white ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute inset-x-3 top-[60px] z-40 max-h-[70dvh] overflow-y-auto rounded-card bg-surface shadow-pop motion-safe:animate-scale-in origin-top-right sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px] text-ink">
          {items.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-ink-muted">You&apos;re all caught up.</p>
          ) : (
            <>
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3"><p className="text-[14px] font-semibold">Notifications</p>{unread > 0 && <span className="font-mono text-[11.5px] text-ink-muted">{unread} new</span>}</div>
            <ul className="divide-y divide-line/70 p-1">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 rounded-tile px-3 py-3 transition-colors hover:bg-sunken/70">
                    <span aria-hidden className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-accent"}`} />
                    <span className="min-w-0">
                      <span className={`block text-[13.5px] ${n.read ? "text-ink-2" : "font-medium text-ink"}`}>{n.text}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-ink-subtle">{relative(new Date(n.at))}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
