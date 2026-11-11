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
    <article className="group overflow-hidden rounded-lg border border-white/[0.07] bg-surface transition-colors hover:border-volt/40">
      <div className="relative aspect-[4/5] bg-white/[0.03]">
        {src ? (
          <>
            {!loaded && <div className="absolute inset-0 bg-white/[0.04]" aria-hidden />}
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
              className="size-full object-cover transition-transform duration-large group-hover:scale-[1.03]"
            />
          </>
        ) : (
          <div className="grid size-full place-items-center text-center text-label text-ink-muted">
            <span className="flex flex-col items-center gap-2 px-4">
              <ImageOff className="size-6" aria-hidden /> Preview unavailable. The full photo can still be downloaded.
            </span>
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-volt px-3 py-1 text-label font-semibold tabular-nums text-ink-inverse">
          {pct}% Match
        </span>
      </div>
      <div className="p-3">
        <a
          href={match.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-volt px-3 py-3 text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-volt-hover"
        >
          <Download className="size-4" aria-hidden /> Download Full HD (DSLR)
          <span className="sr-only">, photo {index + 1}, opens a download from Google Drive</span>
        </a>
      </div>
    </article>
  );
}
