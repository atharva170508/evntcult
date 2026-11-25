"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";

export function ShareEvent({
  url,
  title,
  whenLabel,
  whereLabel,
}: {
  url: string;
  title: string;
  whenLabel?: string;
  whereLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const summary = [whenLabel, whereLabel].filter(Boolean).join(" · ");

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, text: summary || undefined, url }).catch(() => undefined);
      return;
    }
    const text = summary ? `${title}\n${summary}\n${url}` : `${title} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  async function copy() {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    toast("Event link copied.", { tone: "ok" });
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-[16px] font-semibold text-ink">Share</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={share} className={buttonClass("primary", "md")}>
          <Share2 className="size-4" aria-hidden /> Share
        </button>
        <button type="button" onClick={copy} className={buttonClass("secondary", "md")}>
          {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
