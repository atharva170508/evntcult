"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

export function ShareEvent({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const btn = buttonClass("secondary", "sm");

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
        Share
      </button>
      <button onClick={copy} className={btn}>
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
