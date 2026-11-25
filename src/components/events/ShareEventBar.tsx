"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

type ShareEventBarProps = {
  slug: string;
  url: string;
  title: string;
  whenLabel: string;
  whereLabel: string;
};

/**
 * Partiful / Posh-inspired 1-tap invite bar mounted directly under the RSVP card.
 * Keeps WhatsApp group sharing, link copying, native share sheet, and calendar download
 * reachable in one tap on both mobile and desktop.
 */
export function ShareEventBar({
  slug,
  url,
  title,
  whenLabel,
  whereLabel,
}: ShareEventBarProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const inviteText = `${title}\n${whenLabel} · ${whereLabel}\n${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Event link copied.", { tone: "ok" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Could not copy link.", { tone: "error" });
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    await navigator
      .share({
        title,
        text: `${whenLabel} · ${whereLabel}`,
        url,
      })
      .catch(() => undefined);
  }

  const pillClass =
    "inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-[13.5px] font-semibold text-ink-2 transition-all duration-fast hover:border-line-strong hover:bg-sunken hover:text-ink active:scale-[0.98]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-white px-3.5 text-[13.5px] font-semibold text-ink shadow-[var(--lift-1)] transition-all duration-fast hover:bg-sunken active:scale-[0.98] dark:bg-surface"
      >
        <MessageCircle className="size-4 text-[#16A34A]" aria-hidden />
        Invite on WhatsApp
      </a>

      <button type="button" onClick={copyLink} className={pillClass}>
        {copied ? (
          <Check className="size-4 text-[#16A34A]" aria-hidden />
        ) : (
          <Link2 className="size-4" aria-hidden />
        )}
        {copied ? "Copied" : "Copy link"}
      </button>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={pillClass}>
          <Share2 className="size-4" aria-hidden />
          Share
        </button>
      )}

      <a href={`/api/events/${slug}/ics`} download className={pillClass}>
        <CalendarPlus className="size-4" aria-hidden />
        Add to calendar
      </a>
    </div>
  );
}
