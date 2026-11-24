"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Odometer } from "@/components/ui/Odometer";

export function SubscribeTopicButton({
  kind,
  slug,
  initialSubscribed,
  initialCount,
  signedIn,
}: {
  kind: "city" | "category";
  slug: string;
  initialSubscribed: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!signedIn) {
      window.location.href = `/signin?next=${encodeURIComponent(`/${kind}/${slug}`)}`;
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !subscribed;
    setSubscribed(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await fetch("/api/topics/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, slug }),
      });
      if (res.ok) {
        const data = (await res.json()) as { subscribed: boolean; count: number };
        setSubscribed(data.subscribed);
        setCount(data.count);
      } else {
        setSubscribed(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      }
    } catch {
      setSubscribed(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={subscribed}
      className={cn(
        "ui-press inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14.5px] font-semibold transition-colors duration-fast disabled:opacity-60",
        subscribed
          ? "border border-line-strong bg-surface text-ink hover:bg-sunken"
          : "bg-lavender text-ink shadow-button ring-2 ring-inset ring-ink hover:bg-lavender-hover",
      )}
    >
      {subscribed ? (
        <Check className="size-4 text-live" strokeWidth={2.6} aria-hidden />
      ) : (
        <Bell className="size-4" strokeWidth={2.2} aria-hidden />
      )}
      <span>{subscribed ? "Subscribed" : "Subscribe"}</span>
      {count > 0 && (
        <span className="ml-0.5 rounded-md bg-ink/10 px-1.5 py-0.5 font-mono text-[12px] tabular-nums">
          <Odometer value={count} />
        </span>
      )}
    </button>
  );
}
