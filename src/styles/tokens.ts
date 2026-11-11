/**
 * The twin of tokens.css, for the few places CSS variables can't reach:
 * canvas drawing, QR code colours and the web app manifest.
 * tests/tokens.test.ts fails if a value here drifts from tokens.css.
 */
export const TOKENS = {
  surface0: "#09090b",
  surface1: "#0e0e11",
  surface2: "#17171b",
  hairStrong: "#33333c",
  text: "#f0f0ec",
  textMuted: "#8c8c96",
  accent: "#cbf03c",
  accentInk: "#0a0a0c",
  ticket: "#121216",
  qrGround: "#eeeee8",
  paper: "#ffffff",
} as const;

/** CSS variable name for each key above (surface0 → --surface-0). */
export const cssVarName = (key: keyof typeof TOKENS) => `--${key.replace(/([A-Z])/g, "-$1").replace(/(\d)/, "-$1").toLowerCase()}`;

/** A transparent PNG becomes this behind a JPEG. Photos are not UI, so they keep true white. */
export const PHOTO_MATTE = TOKENS.paper;
