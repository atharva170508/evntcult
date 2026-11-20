import QRCode from "qrcode";

/**
 * A designed QR code as an SVG string: round data dots, rounded finder "eyes", a dark ink
 * gradient and the EvntCult ticket mark in the middle. Uses error correction H (30%) so the
 * centre badge, which covers well under that, never stops a scan. Dark on white, with a quiet
 * zone, so every phone camera and our own gate scanner read it.
 */
export function qrArtSvg(payload: string, opts: { ink: string; accent: string }): string {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const q = 3; // quiet zone, in modules
  const size = n + q * 2;
  const id = `g${hash(payload)}`;

  // Centre badge: a square about 22% of the code, aligned to whole modules.
  const badge = Math.max(5, Math.round(n * 0.18) | 1);
  const b0 = Math.floor((n - badge) / 2);
  const b1 = b0 + badge;

  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inBadge = (r: number, c: number) => r >= b0 - 0.5 && r < b1 && c >= b0 - 0.5 && c < b1;

  let dots = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c) || inFinder(r, c) || inBadge(r, c)) continue;
      dots += `M${c + q + 0.04} ${r + q + 0.26}a.22 .22 0 0 1 .22 -.22h.48a.22 .22 0 0 1 .22 .22v.48a.22 .22 0 0 1 -.22 .22h-.48a.22 .22 0 0 1 -.22 -.22Z`;
    }
  }

  const eye = (x: number, y: number) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.4" fill="none" stroke="url(#${id})" stroke-width="1"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".7" fill="url(#${id})"/>`;

  const bx = b0 + q;
  const bs = badge;
  // Ticket glyph centred in the badge: a rounded rectangle with a notch on each side.
  const t = bs * 0.62;
  const tx = bx + (bs - t) / 2;
  const ty = bx + (bs - t * 0.62) / 2;
  const th = t * 0.62;
  const nr = th * 0.17;
  const ticket = `M${tx + 0.4} ${ty}h${t - 0.8}a.4 .4 0 0 1 .4 .4v${th / 2 - nr - 0.4}a${nr} ${nr} 0 0 0 0 ${nr * 2}v${th / 2 - nr - 0.4}a.4 .4 0 0 1 -.4 .4h-${t - 0.8}a.4 .4 0 0 1 -.4 -.4v-${th / 2 - nr - 0.4}a${nr} ${nr} 0 0 0 0 -${nr * 2}v-${th / 2 - nr - 0.4}a.4 .4 0 0 1 .4 -.4Z`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="geometricPrecision">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${opts.ink}"/><stop offset="1" stop-color="#101010"/></linearGradient></defs>` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<path d="${dots}" fill="url(#${id})"/>` +
    eye(q, q) +
    eye(q + n - 7, q) +
    eye(q, q + n - 7) +
    `<rect x="${bx - 0.2}" y="${bx - 0.2}" width="${bs + 0.4}" height="${bs + 0.4}" rx="${bs * 0.26}" fill="#fff"/>` +
    `<rect x="${bx + 0.5}" y="${bx + 0.5}" width="${bs - 1}" height="${bs - 1}" rx="${bs * 0.22}" fill="${opts.accent}"/>` +
    `<path d="${ticket}" fill="#fff"/>` +
    `</svg>`
  );
}

function hash(s: string) {
  let h = 0x811c9dc5;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(36);
}
