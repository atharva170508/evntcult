"use client";

import { useState } from "react";
import { Code2 } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

/** Copy-paste code for a club's own website: the Register card in a frame, or a plain link button. */
export function EmbedCode({ slug, origin }: { slug: string; origin: string }) {
  const [kind, setKind] = useState<"card" | "button">("card");
  const code =
    kind === "card"
      ? `<iframe src="${origin}/embed/${slug}" width="100%" height="170" style="border:0;max-width:580px" title="Register on EvntCult" loading="lazy"></iframe>`
      : `<a href="${origin}/events/${slug}?ref=embed" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#F0D7FF;border:2px solid #1A1A1A;color:#1A1A1A;font:600 15px system-ui,sans-serif;text-decoration:none">Register on EvntCult</a>`;
  return (
    <section aria-labelledby="emb-h" className="rounded-2xl border border-line-strong bg-white p-5">
      <h2 id="emb-h" className="flex items-center gap-2 text-[16px] font-semibold text-ink">
        <Code2 className="size-4" aria-hidden /> Put it on your website
      </h2>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Embed type">
        {(["card", "button"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`h-8 rounded-lg px-3 text-[13px] font-semibold ${kind === k ? "bg-ink text-white" : "text-ink-2 hover:bg-sunken"}`}>
            {k === "card" ? "Event card" : "Button only"}
          </button>
        ))}
      </div>
      <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-sunken p-3 font-mono text-[11.5px] leading-relaxed text-ink-2">{code}</pre>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            toast("Code copied");
          }}
          className="h-9 rounded-xl bg-ink px-3.5 text-[13px] font-semibold text-white"
        >
          Copy code
        </button>
        {kind === "card" && (
          <a href={`/embed/${slug}`} target="_blank" rel="noopener" className="h-9 rounded-xl px-3 text-[13px] font-semibold leading-9 text-ink-2 hover:bg-sunken">
            Preview
          </a>
        )}
      </div>
    </section>
  );
}
