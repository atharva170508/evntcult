"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

export function ShareEvent({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const btn = "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-body-sm font-semibold hover:border-volt/60";

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
    <div className="flex flex-wrap gap-2">
      <button onClick={share} className={btn}>
        <Share2 className="size-4" aria-hidden /> Share
      </button>
      <button onClick={copy} className={btn}>
        <Link2 className="size-4" aria-hidden /> {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
