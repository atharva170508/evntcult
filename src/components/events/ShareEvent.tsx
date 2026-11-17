"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

export function ShareEvent({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, "_blank", "noopener");
  }

  async function copy() {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-[16px] font-semibold text-ink">Share</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={share} className={buttonClass("primary", "md")}>
          <Share2 className="size-4" aria-hidden /> Share
        </button>
        <button onClick={copy} className={buttonClass("secondary", "md")}>
          {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />} {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
