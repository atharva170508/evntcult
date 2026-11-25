"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  Bell,
  CalendarClock,
  CheckCheck,
  MapPin,
  Megaphone,
  Ticket,
} from "lucide-react";
import { relative } from "@/lib/utils";

type InboxKind = "pass" | "reminder" | "venue" | "announcement" | "cancel" | "cert";

interface Item {
  id: string;
  kind?: InboxKind;
  text: string;
  href: string;
  at: string;
  read: boolean;
}

const KIND_ICON: Record<InboxKind, typeof Bell> = {
  pass: Ticket,
  reminder: CalendarClock,
  venue: MapPin,
  announcement: Megaphone,
  cancel: AlertCircle,
  cert: Award,
};

const KIND_TINT: Record<InboxKind, string> = {
  pass: "bg-[#F0D7FF]/60 text-[#5B21B6] dark:bg-[#F0D7FF]/15 dark:text-[#E9D5FF]",
  reminder: "bg-[#FEF3C7] text-[#92400E] dark:bg-[#FEF3C7]/15 dark:text-[#FDE68A]",
  venue: "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#DBEAFE]/15 dark:text-[#BFDBFE]",
  announcement: "bg-[#FFE4E6] text-[#BE123C] dark:bg-[#FFE4E6]/15 dark:text-[#FDA4AF]",
  cancel: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#FEE2E2]/15 dark:text-[#FCA5A5]",
  cert: "bg-[#DCFCE7] text-[#15803D] dark:bg-[#DCFCE7]/15 dark:text-[#BBF7D0]",
};

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

  function markRead() {
    setUnread(0);
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    void fetch("/api/me/notifications", { method: "POST" }).catch(() => null);
  }

  function toggle() {
    const opening = !open;
    setOpen(opening);
    if (opening && unread > 0) {
      setUnread(0);
      void fetch("/api/me/notifications", { method: "POST" }).catch(() => null);
    }
  }

  return (
    <div ref={box} className="sm:relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className={`relative grid size-10 place-items-center rounded-full transition-colors duration-fast ${tone === "dark" ? "text-white/80 hover:bg-white/[0.08] hover:text-white aria-expanded:bg-white/[0.1]" : "text-ink-2 hover:bg-sunken hover:text-ink aria-expanded:bg-sunken"}`}
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-lg bg-accent px-1 font-mono text-[10px] font-medium text-white ring-2 ring-white dark:ring-canvas">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute inset-x-3 top-[60px] z-40 max-h-[70dvh] overflow-y-auto rounded-card border border-line/80 bg-surface text-ink shadow-pop origin-top-right motion-safe:animate-scale-in sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <p className="text-[14px] font-semibold">Updates & reminders</p>
            {items.some((i) => !i.read) && (
              <button
                type="button"
                onClick={markRead}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                <CheckCheck className="size-3.5" aria-hidden /> Mark read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-sunken text-ink-muted" aria-hidden>
                <Bell className="size-4" />
              </span>
              <p className="mt-3 text-[14px] font-medium text-ink">You&apos;re all caught up.</p>
              <p className="mt-1 text-[12.5px] text-ink-muted">
                Venue changes, reminders, and host announcements show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line/70 p-1.5">
              {items.map((n) => {
                const kind: InboxKind = n.kind ?? "announcement";
                const Icon = KIND_ICON[kind];
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-tile px-3 py-3 transition-colors hover:bg-sunken/70"
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${KIND_TINT[kind]}`}
                      >
                        <Icon className="size-3.5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[13.5px] leading-snug ${n.read ? "text-ink-2" : "font-medium text-ink"}`}>
                          {n.text}
                        </span>
                        <span className="mt-1 block font-mono text-[11px] text-ink-subtle">
                          {relative(new Date(n.at))}
                        </span>
                      </span>
                      {!n.read && (
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
