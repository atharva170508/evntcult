"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOKENS } from "@/styles/tokens";

export interface SavePassProps {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  passCode: string;
  /** The same QR SVG shown on screen (dark on white). */
  qrSvg: string;
  className?: string;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "…");
  }
  return lines;
}

/**
 * Saves the pass as a PNG image (works offline at the gate, in the photo gallery).
 * Drawn on a canvas in the browser: nothing is uploaded.
 */
export function SavePassButton({ className, ...p }: SavePassProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    setBusy(true);
    setError(false);
    try {
      const W = 1080, H = 1560, PAD = 84;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const font = `${getComputedStyle(document.body).fontFamily}, system-ui, sans-serif`;
      await document.fonts.ready;

      // Card
      ctx.fillStyle = TOKENS.surface0;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = TOKENS.accent;
      ctx.beginPath();
      ctx.roundRect(PAD - 24, PAD - 24, W - 2 * (PAD - 24), 360, 48);
      ctx.fill();

      // Title block on yellow
      ctx.fillStyle = TOKENS.accentInk;
      ctx.font = `700 34px ${font}`;
      ctx.fillText("EVNTCULT PASS", PAD + 20, PAD + 44);
      ctx.font = `800 72px ${font}`;
      wrap(ctx, p.title, W - 2 * PAD - 40, 2).forEach((l, i) => ctx.fillText(l, PAD + 20, PAD + 140 + i * 80));
      ctx.font = `600 34px ${font}`;
      ctx.fillText(`${p.dateLabel} · ${p.timeLabel}`, PAD + 20, PAD + 300);

      // QR on white
      const qrSize = 720;
      const qx = (W - qrSize) / 2, qy = 520;
      ctx.fillStyle = TOKENS.qrGround;
      ctx.beginPath();
      ctx.roundRect(qx - 40, qy - 40, qrSize + 80, qrSize + 80, 40);
      ctx.fill();
      const svg = p.qrSvg.includes("xmlns") ? p.qrSvg : p.qrSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, qx, qy, qrSize, qrSize);
      } finally {
        URL.revokeObjectURL(url);
      }

      // Pass code + venue
      ctx.textAlign = "center";
      ctx.fillStyle = TOKENS.text;
      ctx.font = `700 58px ui-monospace, Menlo, monospace`;
      ctx.fillText(p.passCode, W / 2, 1400);
      ctx.fillStyle = TOKENS.textMuted;
      ctx.font = `500 34px ${font}`;
      ctx.fillText(p.venue, W / 2, 1462);

      const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `evntcult-pass-${p.passCode}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className={cn("inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-body-sm font-semibold transition-colors hover:border-volt/60 disabled:opacity-50", className)}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />} Save pass image
      </button>
      {error && <span role="alert" className="text-label font-semibold text-danger">Couldn&apos;t save. Take a screenshot instead.</span>}
    </>
  );
}
