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
