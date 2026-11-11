"use client";

import { useState } from "react";
import { matchPercent } from "@/lib/face/embedding";
import type { PhotoMatch } from "@/lib/data/face-search";
import { buttonClass } from "@/components/ui/Button";

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
    <article className="group overflow-hidden rounded-lg border border-white/[0.07] bg-surface transition-colors hover:border-line-strong">
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
              className="size-full object-cover"
            />
          </>
        ) : (
          <div className="grid size-full place-items-center text-center text-label text-ink-muted">
            <span className="px-4">
              Preview unavailable. The full photo can still be downloaded.
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-sm bg-canvas px-2 py-1 font-mono text-caption tabular-nums text-ink">
          {pct}% Match
        </span>
      </div>
      <div className="p-3">
        <a
          href={match.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "md", "w-full")}
        >
          Download full size
          <span className="sr-only">, photo {index + 1}, opens a download from Google Drive</span>
        </a>
      </div>
    </article>
  );
}
