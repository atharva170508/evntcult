"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

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

      // Paper card with an ink header block (matches the on-screen pass)
      ctx.fillStyle = "#F6F5F1";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#111110";
      ctx.beginPath();
      ctx.roundRect(PAD - 24, PAD - 24, W - 2 * (PAD - 24), 360, 40);
      ctx.fill();

      // Title block on ink, with the signal caret
      ctx.fillStyle = "#D93A12";
      ctx.fillRect(PAD + 20, PAD + 14, 8, 40);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `500 30px ui-monospace, Menlo, monospace`;
      ctx.fillText("EVNTCULT · ONEPASS", PAD + 46, PAD + 46);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 70px ${font}`;
      wrap(ctx, p.title, W - 2 * PAD - 40, 2).forEach((l, i) => ctx.fillText(l, PAD + 20, PAD + 140 + i * 80));
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `500 34px ${font}`;
      ctx.fillText(`${p.dateLabel} · ${p.timeLabel}`, PAD + 20, PAD + 300);

      // QR on white
      const qrSize = 720;
      const qx = (W - qrSize) / 2, qy = 520;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qx - 40, qy - 40, qrSize + 80, qrSize + 80, 32);
      ctx.fill();
      ctx.strokeStyle = "#E4E1DA";
      ctx.lineWidth = 2;
      ctx.stroke();
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
      ctx.fillStyle = "#111110";
      ctx.font = `500 58px ui-monospace, Menlo, monospace`;
      ctx.fillText(p.passCode, W / 2, 1400);
      ctx.fillStyle = "#62605A";
      ctx.font = `400 34px ${font}`;
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
        className={buttonClass("secondary", "md", className)}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />} Save pass image
      </button>
      {error && <span role="alert" className="text-center text-[12.5px] font-medium text-danger">Couldn&apos;t save. Take a screenshot instead.</span>}
    </>
  );
}
