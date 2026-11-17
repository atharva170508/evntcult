"use client";

import { useState } from "react";
import { Download, ImageOff } from "lucide-react";
import { matchPercent } from "@/lib/face/embedding";
import type { PhotoMatch } from "@/lib/data/face-search";

/**
 * One AI Face Search result: our small thumbnail (falling back to Drive's own preview, then to
 * a plain placeholder), a "96% Match" pill, and a direct download of the original from Drive.
 */
export function PhotoMatchCard({ match, index }: { match: PhotoMatch; index: number }) {
  const [src, setSrc] = useState<string | null>(match.thumbnailUrl);
  const [loaded, setLoaded] = useState(false);
  const pct = matchPercent(match.similarity);

  function onError() {
    setLoaded(false);
    setSrc((cur) => (cur === match.thumbnailUrl && match.fallbackThumbnailUrl !== cur ? match.fallbackThumbnailUrl : null));
  }

  return (
    <article className="card card-hover group overflow-hidden">
      <div className="relative aspect-[4/5] bg-sunken">
        {src ? (
          <>
            {!loaded && <div className="absolute inset-0 skeleton rounded-none" aria-hidden />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={src}
              src={src}
              alt={`Matched photo ${index + 1}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={onError}
              className="size-full object-cover transition-transform duration-500"
            />
          </>
        ) : (
          <div className="grid size-full place-items-center text-center text-[12.5px] text-ink-muted">
            <span className="flex flex-col items-center gap-2 px-4">
              <ImageOff className="size-6" aria-hidden /> Preview unavailable. The full photo can still be downloaded.
            </span>
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-xl bg-white/95 px-2.5 py-1 font-mono text-[11.5px] font-medium tabular-nums text-ink shadow-[0_1px_2px_rgba(20,22,27,0.2)]">
          {pct}% Match
        </span>
      </div>
      <div className="p-2.5">
        <a
          href={match.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-night px-3 text-[13px] font-medium text-white shadow-button transition-colors hover:bg-night-3"
        >
          <Download className="size-4" aria-hidden /> Download full HD
          <span className="sr-only">, photo {index + 1}, opens a download from Google Drive</span>
        </a>
      </div>
    </article>
  );
}
