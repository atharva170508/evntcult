"use client";

import { useEffect, useState } from "react";

/**
 * A slow, breathing glow behind the event header, in the flyer's own colour. The colour is
 * read from the flyer on an offscreen canvas (average of its saturated pixels); if the image
 * can't be read (another site without CORS), the event's accent colour is used instead.
 */
export function FlyerAura({ src, fallback }: { src: string | null; fallback: string }) {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 24;
        const g = c.getContext("2d", { willReadFrequently: true });
        if (!g) return;
        g.drawImage(img, 0, 0, 24, 24);
        const d = g.getImageData(0, 0, 24, 24).data;
        let r = 0,
          gg = 0,
          b = 0,
          n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const max = Math.max(d[i], d[i + 1], d[i + 2]);
          const min = Math.min(d[i], d[i + 1], d[i + 2]);
          // Skip near-white, near-black and grey pixels: we want the flyer's colour, not its paper.
          if (max < 40 || min > 225 || max - min < 40) continue;
          r += d[i];
          gg += d[i + 1];
          b += d[i + 2];
          n++;
        }
        if (n > 8 && alive) setColor(`rgb(${Math.round(r / n)}, ${Math.round(gg / n)}, ${Math.round(b / n)})`);
      } catch {
        // Tainted canvas: keep the accent colour.
      }
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  return (
    <div
      aria-hidden
      className="aura pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[520px] w-[min(1100px,140vw)] rounded-[50%] blur-3xl"
      style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${color} 38%, transparent), transparent)`, transition: "background 600ms ease" }}
    />
  );
}
