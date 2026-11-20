"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Partiful's "Interested": keep an event on your list without registering. */
export function InterestedButton({ slug, saved: initial, signedIn, className }: { slug: string; saved: boolean; signedIn: boolean; className?: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/signin?next=${encodeURIComponent(`/events/${slug}`)}`);
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    setBusy(true);
    setError(false);
    const res = await fetch(`/api/events/${slug}/save`, { method: next ? "POST" : "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setSaved(!next);
      setError(true);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      title={error ? "Didn't save. Try again." : undefined}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-semibold transition-colors duration-fast disabled:opacity-70",
        saved ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink hover:border-ink",
        className,
      )}
    >
      <m.span key={String(saved)} initial={{ scale: saved ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 18 }} className="inline-flex">
        <Star className={cn("size-[18px]", saved && "fill-[#FFD166] text-[#FFD166]")} strokeWidth={1.9} aria-hidden />
      </m.span>
      {error ? "Try again" : saved ? "Interested" : "I'm interested"}
    </button>
  );
}
