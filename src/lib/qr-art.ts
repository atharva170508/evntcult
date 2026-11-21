import QRCode from "qrcode";
// @ts-expect-error no types for the internal module; it is plain CommonJS.
import AlignmentPattern from "qrcode/lib/core/alignment-pattern";

/**
 * EvntCult's QR codes. Every QR on the site is drawn here, never as plain black squares:
 *
 * - data modules flow into each other (neighbours join into rounded runs), drawn with a gradient
 *   from ink into the event's colour, both kept dark so every camera reads them;
 * - the three finder "eyes" are a square ring in the event's colour around a rounded ink core
 *   (square outer corners: some decoders, OpenCV included, can't find fully rounded eyes);
 * - a centre badge says what the code is for: a ticket (pass), ₹ (UPI payment), a seal
 *   (certificate check), scan corners (gate volunteer link) or the EvntCult mark (any link).
 *
 * Error correction H (30%) and a badge that covers far less keep it scannable; alignment
 * patterns under the badge are always drawn. Tested with jsQR and OpenCV across sizes.
 */

export type QrKind = "pass" | "upi" | "verify" | "volunteer" | "link" | "gate";

export interface QrOptions {
  /** Main colour: the event accent, or brand red. Darkened automatically for the data. */
  accent?: string;
  /** Darkest colour; defaults to near-black. */
  ink?: string;
  kind?: QrKind;
}

const BRAND = "#E3264F";

/** Back-compat: the pass art used before (ink + accent). */
export function qrArtSvg(payload: string, opts: { ink: string; accent: string }): string {
  return brandQr(payload, { accent: opts.accent, ink: "#141414", kind: "pass" });
}

export function brandQr(payload: string, opts: QrOptions = {}): string {
  const kind = opts.kind ?? "link";
  const accent = opts.accent ?? (kind === "upi" ? "#0B7A54" : kind === "verify" ? "#9A7426" : BRAND);
  const ink = opts.ink ?? "#141414";
  const dataEnd = darken(accent, 0.42); // dark enough to read as "black" to scanners
  const eyeRing = darken(accent, 0.18);

  const qr = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const version = (n - 17) / 4;
  const q = 4;
  const size = n + q * 2;
  const id = `q${hash(payload + kind)}`;
  const dark = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && qr.modules.get(r, c);

  // The gate view gets no badge: full-screen, nothing in the way.
  const withBadge = kind !== "gate";
  const badge = withBadge ? Math.max(5, Math.round(n * (version >= 7 ? 0.17 : 0.2)) | 1) : 0;
  const b0 = Math.floor((n - badge) / 2);
  const b1 = b0 + badge;

  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const align = alignmentCentres(version);
  const inAlign = (r: number, c: number) => align.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2);
  const inBadge = (r: number, c: number) => withBadge && r >= b0 && r < b1 && c >= b0 && c < b1 && !inAlign(r, c);
  const skip = (r: number, c: number) => inFinder(r, c) || inBadge(r, c);

  // Flowing modules: a full-size dot per dark module, joined to dark neighbours right and below.
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!dark(r, c) || skip(r, c)) continue;
      const x = c + q;
      const y = r + q;
      d += `M${x + 0.5} ${y}a.5 .5 0 1 1 0 1a.5 .5 0 1 1 0 -1Z`;
      if (dark(r, c + 1) && !skip(r, c + 1)) d += `M${x + 0.5} ${y}h1v1h-1Z`;
      if (dark(r + 1, c) && !skip(r + 1, c)) d += `M${x} ${y + 0.5}h1v1h-1Z`;
    }
  }

  const eye = (x: number, y: number) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="0" fill="none" stroke="${eyeRing}" stroke-width="1"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.6" fill="${ink}"/>`;

  let badgeSvg = "";
  if (withBadge) {
    const bx = b0 + q;
    const bs = badge;
    const cx = bx + bs / 2;
    const fill = kind === "pass" ? accent : kind === "upi" ? "#0B7A54" : kind === "verify" ? "#C9A45C" : kind === "volunteer" ? ink : BRAND;
    badgeSvg =
      `<rect x="${bx - 0.3}" y="${bx - 0.3}" width="${bs + 0.6}" height="${bs + 0.6}" rx="${bs * 0.3}" fill="#fff"/>` +
      `<rect x="${bx + 0.45}" y="${bx + 0.45}" width="${bs - 0.9}" height="${bs - 0.9}" rx="${bs * 0.24}" fill="${fill}"/>` +
      glyph(kind, cx, bs);
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="geometricPrecision" aria-hidden="true">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ink}"/><stop offset=".55" stop-color="${mix(ink, dataEnd, 0.5)}"/><stop offset="1" stop-color="${dataEnd}"/></linearGradient></defs>` +
    `<rect width="${size}" height="${size}" rx="2.4" fill="#fff"/>` +
    `<path d="${d}" fill="url(#${id})"/>` +
    eye(q, q) +
    eye(q + n - 7, q) +
    eye(q, q + n - 7) +
    badgeSvg +
    `</svg>`
  );
}

/** The centre glyph, in white, sized to the badge. */
function glyph(kind: QrKind, cx: number, bs: number): string {
  const s = bs * 0.5; // glyph box
  const x = cx - s / 2;
  const y = cx - s / 2;
  const w = (v: number) => (v * s).toFixed(3);
  switch (kind) {
    case "upi":
      // ₹
      return `<path d="M${x + +w(0.18)} ${y + +w(0.12)}h${w(0.64)}M${x + +w(0.18)} ${y + +w(0.34)}h${w(0.64)}M${x + +w(0.3)} ${y + +w(0.12)}c${w(0.5)} 0 ${w(0.5)} ${w(0.46)} 0 ${w(0.46)}h${-w(0.12)}l${w(0.46)} ${w(0.42)}" fill="none" stroke="#fff" stroke-width="${w(0.12)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "verify":
      // check mark
      return `<path d="M${x + +w(0.14)} ${y + +w(0.52)}l${w(0.24)} ${w(0.24)}l${w(0.48)} ${w(-0.52)}" fill="none" stroke="#fff" stroke-width="${w(0.16)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "volunteer": {
      // scan corners
      const k = w(0.28);
      const sw = w(0.12);
      return (
        `<path d="M${x} ${y + +k}V${y}h${k}M${x + s - +k} ${y}H${x + s}v${k}M${x + s} ${y + s - +k}V${y + s}h${-k}M${x + +k} ${y + s}H${x}v${-k}" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M${x + +w(0.2)} ${cx}h${w(0.6)}" stroke="#fff" stroke-width="${sw}" stroke-linecap="round"/>`
      );
    }
    default: {
      // ticket: rounded rectangle with a notch each side and a perforation
      const tw = s * 1.06;
      const th = s * 0.72;
      const tx = cx - tw / 2;
      const ty = cx - th / 2;
      const r = th * 0.16;
      const nr = th * 0.17;
      const mid = th / 2 - nr - r;
      return (
        `<path d="M${tx + r} ${ty}h${tw - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${mid}a${nr} ${nr} 0 0 0 0 ${nr * 2}v${mid}a${r} ${r} 0 0 1 ${-r} ${r}h${-(tw - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-mid}a${nr} ${nr} 0 0 0 0 ${-nr * 2}v${-mid}a${r} ${r} 0 0 1 ${r} ${-r}Z" fill="#fff"/>` +
        `<path d="M${tx + tw * 0.68} ${ty + th * 0.2}v${th * 0.6}" stroke="${kind === "link" ? BRAND : "rgba(0,0,0,.35)"}" stroke-width="${(th * 0.07).toFixed(3)}" stroke-dasharray="${(th * 0.08).toFixed(3)} ${(th * 0.1).toFixed(3)}" stroke-linecap="round"/>`
      );
    }
  }
}

/** Alignment pattern centres for a QR version, from the qrcode package's own table. */
function alignmentCentres(v: number): [number, number][] {
  return v < 2 ? [] : (AlignmentPattern.getPositions(v) as [number, number][]);
}

function hex(c: string): [number, number, number] {
  const h = c.replace("#", "");
  const v = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6);
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
const toHex = (rgb: number[]) => `#${rgb.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;
/** Darken towards black so relative luminance stays low (scanner-safe), keeping the hue. */
function darken(c: string, maxLum: number): string {
  let rgb = hex(c);
  const lum = (v: number[]) => {
    const f = (x: number) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
  };
  // Target luminance: well under mid-grey.
  const target = 0.06 + maxLum * 0.1;
  for (let i = 0; i < 40 && lum(rgb) > target; i++) rgb = rgb.map((x) => x * 0.9) as [number, number, number];
  return toHex(rgb);
}
function mix(a: string, b: string, t: number) {
  const x = hex(a);
  const y = hex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

function hash(s: string) {
  let h = 0x811c9dc5;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(36);
}
