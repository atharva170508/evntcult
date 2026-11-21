"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/** The empty guest list's one job: get the link out. */
export function ShareFirst({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url).catch(() => undefined);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-semibold text-white transition-colors duration-fast hover:bg-ink-2"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? "Link copied" : "Copy event link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title}: register and get your pass here ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink transition-colors duration-fast hover:border-ink"
      >
        <MessageCircle className="size-4" aria-hidden /> Share on WhatsApp
      </a>
    </div>
  );
}
