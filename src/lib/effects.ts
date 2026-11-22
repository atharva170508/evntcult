/** Page effects an organizer can put on the event page (Partiful-style falling emoji). */
export const EFFECTS = {
  none: { label: "None", glyphs: [] as string[] },
  confetti: { label: "Confetti", glyphs: ["🎉", "🎊", "✨"] },
  sparkles: { label: "Sparkles", glyphs: ["✨", "⭐", "💫"] },
  hearts: { label: "Hearts", glyphs: ["❤️", "💖", "💕"] },
  fire: { label: "Fire", glyphs: ["🔥", "⚡"] },
  music: { label: "Music", glyphs: ["🎵", "🎶", "🎧"] },
  code: { label: "Hackathon", glyphs: ["💻", "⚡", "🚀"] },
  sports: { label: "Sports", glyphs: ["🏆", "⚽", "🏏"] },
  diyas: { label: "Diyas", glyphs: ["🪔", "✨", "🌼"] },
  snow: { label: "Snow", glyphs: ["❄️", "❅", "❆"] },
} as const;
export type EffectKey = keyof typeof EFFECTS;
export const EFFECT_KEYS = Object.keys(EFFECTS) as [EffectKey, ...EffectKey[]];
export const isEffect = (v: unknown): v is EffectKey => typeof v === "string" && v in EFFECTS;

/** Reactions on guest wall posts. */
export const WALL_EMOJI = ["🔥", "🙌", "😂", "❤️"] as const;

/** Page look (Luma's theme sheet): the background behind the event page and the title's type. */
export const PAGE_STYLES = {
  glow: { label: "Glow", hint: "The poster's colour breathes behind the page" },
  mesh: { label: "Gradient", hint: "Soft colour wash in the event's colour" },
  dots: { label: "Dots", hint: "Quiet dot grid" },
  plain: { label: "Minimal", hint: "Just the page" },
} as const;
export const TITLE_FONTS = {
  classic: { label: "Classic", cls: "font-display tracking-[-0.025em]" },
  italic: { label: "Elegant", cls: "font-display italic tracking-[-0.02em]" },
  modern: { label: "Modern", cls: "font-sans font-semibold tracking-[-0.035em]" },
  loud: { label: "Loud", cls: "font-sans font-black uppercase tracking-[-0.03em] !leading-[0.95]" },
} as const;
export type PageStyle = keyof typeof PAGE_STYLES;
export type TitleFont = keyof typeof TITLE_FONTS;
export const PAGE_STYLE_KEYS = Object.keys(PAGE_STYLES) as [PageStyle, ...PageStyle[]];
export const TITLE_FONT_KEYS = Object.keys(TITLE_FONTS) as [TitleFont, ...TitleFont[]];
/** events.look is "style:font", e.g. "mesh:loud". Unknown parts fall back to the defaults. */
export function parseLook(v: string | null | undefined): { style: PageStyle; font: TitleFont } {
  const [a, b] = (v ?? "").split(":");
  return { style: a && a in PAGE_STYLES ? (a as PageStyle) : "glow", font: b && b in TITLE_FONTS ? (b as TitleFont) : "classic" };
}
