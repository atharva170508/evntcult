"use client";

import { useState } from "react";
import { TOKENS } from "@/styles/tokens";
import { Button } from "@/components/ui/Button";

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
      // Resolve the display face (the variable holds var() references a canvas can't read).
      const probe = document.createElement("span");
      probe.style.fontFamily = "var(--font-display)";
      document.body.appendChild(probe);
      const display = `${getComputedStyle(probe).fontFamily}, system-ui, sans-serif`;
      probe.remove();
      await document.fonts.ready;

      // Card
      ctx.fillStyle = TOKENS.surface0;
      ctx.fillRect(0, 0, W, H);
      // The ticket: its own ground, a hairline, small corners (§8).
      ctx.fillStyle = TOKENS.ticket;
      ctx.strokeStyle = TOKENS.hairStrong;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(PAD - 24, PAD - 24, W - 2 * (PAD - 24), H - 2 * (PAD - 24), 18);
      ctx.fill();
      ctx.stroke();

      // Title block on yellow
      ctx.fillStyle = TOKENS.accent;
      ctx.font = `500 30px ui-monospace, Menlo, monospace`;
      ctx.fillText("EVNTCULT PASS", PAD + 20, PAD + 44);
      ctx.fillStyle = TOKENS.text;
      ctx.font = `600 72px ${display}`;
      wrap(ctx, p.title.toUpperCase(), W - 2 * PAD - 40, 2).forEach((l, i) => ctx.fillText(l, PAD + 20, PAD + 140 + i * 80));
      ctx.font = `400 32px ui-monospace, Menlo, monospace`;
      ctx.fillText(`${p.dateLabel} · ${p.timeLabel}`, PAD + 20, PAD + 300);

      // QR on white
      const qrSize = 720;
      const qx = (W - qrSize) / 2, qy = 520;
      ctx.fillStyle = TOKENS.qrGround;
      ctx.beginPath();
      ctx.roundRect(qx - 40, qy - 40, qrSize + 80, qrSize + 80, 12);
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
      ctx.font = `500 54px ui-monospace, Menlo, monospace`;
      ctx.fillText(p.passCode, W / 2, 1400);
      ctx.fillStyle = TOKENS.textMuted;
      ctx.font = `400 32px ui-monospace, Menlo, monospace`;
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
      <Button type="button" variant="secondary" onClick={save} loading={busy} className={className}>
        Save pass image
      </Button>
      {error && <span role="alert" className="text-label text-bad">Couldn&apos;t save. Take a screenshot instead.</span>}
    </>
  );
}
