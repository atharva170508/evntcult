import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { brandQr, type QrKind } from "@/lib/qr-art";

// sharp ships with Next on most platforms; if it isn't installed, skip the render check.
let sharp: ((input: Buffer, o?: object) => import("sharp").Sharp) | null = null;
try {
  sharp = (await import("sharp")).default as never;
} catch {
  sharp = null;
}

const PAYLOADS: Record<QrKind, string> = {
  pass: "evntcult://p/QAD7QU7CGHJ6NNUN3GSDGF7FBW",
  gate: "evntcult://p/G6Q7OZCYBU72VGJL4K56O7LXTU",
  upi: "upi://pay?pa=artsclub@okaxis&pn=Arts%20Club%20KKW&am=719.00&cu=INR&tn=EC-NEON-0554",
  verify: "https://evntcult.caliper.workers.dev/verify/7KQ2MZ9TXA",
  volunteer: "https://evntcult.caliper.workers.dev/v/4f9c2b7e1d0a8c6b5e3f2a1d0c9b8a7e6f5d4c3b",
  link: "https://evntcult.caliper.workers.dev/e/neon-night",
};

describe("brandQr", () => {
  it("draws an SVG for every kind, with its badge (none for the gate view)", () => {
    for (const kind of Object.keys(PAYLOADS) as QrKind[]) {
      const svg = brandQr(PAYLOADS[kind], { kind, accent: "#4B2E86" });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.includes('rx="0.6"')).toBe(true); // rounded eye cores
    }
  });

  it.skipIf(!sharp)("every kind still scans, in several event colours, at a normal display size", async () => {
    for (const kind of Object.keys(PAYLOADS) as QrKind[]) {
      for (const accent of ["#E3264F", "#4B2E86", "#11796D", "#F0D7FF", "#FFD27A"]) {
        const svg = Buffer.from(brandQr(PAYLOADS[kind], { kind, accent }));
        const { data, info } = await sharp!(svg, { density: 300 }).resize(260, 260).flatten({ background: "#fff" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const r = jsQR(new Uint8ClampedArray(data), info.width, info.height);
        expect(r?.data, `${kind} in ${accent}`).toBe(PAYLOADS[kind]);
      }
    }
  });
});
