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
      <button onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} className="relative grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:border-volt/60 sm:size-11">
        <Bell className="size-[18px]" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-volt px-1 font-mono text-[10px] font-bold text-ink-inverse">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute inset-x-4 top-[66px] z-40 max-h-[70dvh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop sm:inset-x-auto sm:right-0 sm:top-[52px] sm:w-[340px]">
          {items.length === 0 ? (
            <p className="p-5 text-center text-[14px] text-ink-muted">No notifications</p>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-white/5">
                    <span className={`block text-[13.5px] ${n.read ? "text-ink-2" : "font-semibold"}`}>{n.text}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-subtle">{relative(new Date(n.at))}</span>
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
