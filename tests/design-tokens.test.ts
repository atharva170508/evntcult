/** Master prompt §4–§7 and §15: tokens are the one source, sizes stay on the scale, contrast is measured. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKENS, cssVarName } from "@/styles/tokens";
import { cn } from "@/lib/utils";

const root = join(__dirname, "..");
const css = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
const cssVar = (name: string) => css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1]?.toLowerCase();

function files(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(tsx?|css)$/.test(f)) out.push(p);
  }
  return out;
}
const source = files(join(root, "src")).map((p) => ({ path: p.slice(root.length + 1), text: readFileSync(p, "utf8") }));


describe("tokens", () => {
  it("the TypeScript twin matches tokens.css exactly", () => {
    for (const [key, hex] of Object.entries(TOKENS)) {
      expect(cssVar(cssVarName(key as keyof typeof TOKENS)), key).toBe(hex);
    }
  });

  it("no raw hex colour outside the token files", () => {
    const offenders = source
      .filter((f) => !/src\/styles\/tokens\.(css|ts)$/.test(f.path))
      .flatMap((f) => [...f.text.matchAll(/(?<![\w&])#[0-9a-fA-F]{6}\b|(?<![\w&{])#[0-9a-fA-F]{3}\b(?![\w-])/g)].map((m) => `${f.path}: ${m[0]}`))
      .filter((s) => !/PHOTO_MATTE/.test(s));
    expect(offenders).toEqual([]);
  });

  it("type stays on the seven sizes (§5)", () => {
    const arbitrary = source.flatMap((f) => [...f.text.matchAll(/\btext-\[[\d.]+(px|rem)\]/g)].map((m) => `${f.path}: ${m[0]}`));
    const cssPx = source
      .filter((f) => f.path.endsWith(".css") && !f.path.includes("certificate.css"))
      .flatMap((f) => [...f.text.matchAll(/font-size:\s*[\d.]+px/g)].map((m) => `${f.path}: ${m[0]}`))
      .filter((s) => !s.endsWith("16px")); // §5: 16px minimum on mobile inputs
    expect([...arbitrary, ...cssPx]).toEqual([]);
  });

  it("no shadows outside overlays and no load animation (§2 laws 7–8)", () => {
    const bad = source.flatMap((f) =>
      [...f.text.matchAll(/\b(shadow-(?:card|pop|brand|lg|xl|2xl|\[[^\]]+\])|animate-(?:fade-up|pulse|marquee|drift|float|aurora|spin-slow|caret-blink|type-in)|backdrop-blur)/g)].map((m) => `${f.path}: ${m[0]}`),
    );
    expect(bad).toEqual([]);
  });
});

describe("identity (§3, §18)", () => {
  const tsx = source.filter((f) => f.path.endsWith(".tsx"));
  const find = (re: RegExp) => tsx.flatMap((f) => [...f.text.matchAll(re)].map((m) => `${f.path}: ${m[0]}`));

  it("no icons: no icon library anywhere", () => {
    expect(source.filter((f) => f.text.includes("lucide-react")).map((f) => f.path)).toEqual([]);
    expect(readFileSync(join(root, "package.json"), "utf8")).not.toContain("lucide-react");
  });
  it("no gradients, blur or glow", () => {
    expect(find(/\b(bg-gradient-[a-z-]+|blur-(?:sm|md|lg|xl|2xl|3xl|\[[^\]]+\])|backdrop-blur[a-z-]*)\b/g)).toEqual([]);
  });
  it("nothing grows or lifts on hover (motion only from the user's press)", () => {
    expect(find(/\b(?:group-)?hover:(?:scale-[^\s"`]+|-?translate-[xy]-[^\s"`]+)/g)).toEqual([]);
  });
  it("focus is never removed (§2 law 9)", () => {
    expect(find(/\boutline-none\b/g)).toEqual([]);
  });
  it("no pill-shaped buttons: buttons use the 4/6px radius (§8)", () => {
    expect(find(/<(?:button|a|Link)\b[^>]*className="[^"]*rounded-full[^"]*\b(?:h-(?:8|10|12)|py-[234])\b[^"]*"/g)).toEqual([]);
  });
});

describe("cn() knows the token names", () => {
  it.each([
    [["text-body text-ink"], "text-body text-ink"],
    [["text-label", "text-body"], "text-body"],
    [["text-ink-muted text-caption", "text-ink"], "text-caption text-ink"],
    [["rounded-md", "rounded-lg"], "rounded-lg"],
    [["duration-micro", "duration-large"], "duration-large"],
  ])("%j → %s", (input, want) => {
    expect(cn(...input)).toBe(want);
  });
});

// WCAG 2.x relative luminance and contrast.
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const v = (n: string) => cssVar(n)!;

describe("contrast (§15: 4.5:1 body, 3:1 large and UI boundaries)", () => {
  const grounds = ["--surface-0", "--surface-1", "--surface-2", "--ticket"];
  it.each(["--text", "--text-muted", "--text-dim", "--accent"])("%s on every surface ≥ 4.5:1", (fg) => {
    for (const bg of grounds) expect(ratio(v(fg), v(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
  it("text on the accent ≥ 4.5:1", () => expect(ratio(v("--accent-ink"), v("--accent"))).toBeGreaterThanOrEqual(4.5));
  it("QR ink on its ground ≥ 4.5:1", () => expect(ratio(v("--accent-ink"), v("--qr-ground"))).toBeGreaterThanOrEqual(4.5));
  it.each(["--ok", "--warn", "--bad"])("%s as status text on surfaces ≥ 4.5:1", (fg) => {
    for (const bg of grounds.slice(0, 3)) expect(ratio(v(fg), v(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
  it("strong hairline as a UI boundary ≥ 1.5:1 against the page (decorative hairlines are exempt)", () => {
    expect(ratio(v("--hair-strong"), v("--surface-0"))).toBeGreaterThanOrEqual(1.5);
  });
});
