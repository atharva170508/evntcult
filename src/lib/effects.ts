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

/** Page look (Luma-inspired theme sheet): 6 architectural textures + 5 typographic voices. */
export const PAGE_STYLES = {
  plain: { label: "Minimal", hint: "Clean paper & cover tint" },
  dots: { label: "Dot Matrix", hint: "Fine architectural dot grid" },
  ruled: { label: "Notebook", hint: "Horizontal editorial lines" },
  grid: { label: "Blueprint", hint: "Subtle graph-paper grid" },
  spotlight: { label: "Stage Glow", hint: "Theatrical overhead wash" },
  diagonal: { label: "Turf Stripe", hint: "Crisp diagonal stadium lines" },
} as const;

export const TITLE_FONTS = {
  classic: { label: "Classic", cls: "font-display tracking-[-0.025em]" },
  italic: { label: "Editorial", cls: "font-display italic tracking-[-0.02em]" },
  modern: { label: "Modern", cls: "font-sans font-semibold tracking-[-0.035em]" },
  loud: { label: "Poster", cls: "font-sans font-black uppercase tracking-[-0.03em] !leading-[0.95]" },
  mono: { label: "Spec", cls: "font-mono font-semibold tracking-[-0.04em] !leading-[1.02]" },
} as const;

export type PageStyle = keyof typeof PAGE_STYLES;
export type TitleFont = keyof typeof TITLE_FONTS;
export const PAGE_STYLE_KEYS = Object.keys(PAGE_STYLES) as [PageStyle, ...PageStyle[]];
export const TITLE_FONT_KEYS = Object.keys(TITLE_FONTS) as [TitleFont, ...TitleFont[]];

/** events.look is "style:font", e.g. "grid:mono". Unknown parts fall back to the defaults. */
export function parseLook(v: string | null | undefined): { style: PageStyle; font: TitleFont } {
  const [a, b] = (v ?? "").split(":");
  return {
    style: a && a in PAGE_STYLES ? (a as PageStyle) : "plain",
    font: b && b in TITLE_FONTS ? (b as TitleFont) : "classic",
  };
}

export type ThemeCategoryCode = "SPORTS" | "TECH" | "CULTURAL" | "PARTY" | "WORKSHOP" | "GAMING" | "TALK";

export const THEME_CATEGORIES: { code: ThemeCategoryCode; label: string }[] = [
  { code: "SPORTS", label: "Sports" },
  { code: "TECH", label: "Tech & Hackathons" },
  { code: "CULTURAL", label: "Cultural" },
  { code: "PARTY", label: "Parties & Music" },
  { code: "WORKSHOP", label: "Workshops" },
  { code: "GAMING", label: "Gaming" },
  { code: "TALK", label: "Talks" },
];

/** Curated 1-tap event theme presets — 3 distinct options for every category (21 total). */
export interface EventThemePreset {
  id: string;
  category: ThemeCategoryCode;
  name: string;
  vibe: string;
  style: PageStyle;
  font: TitleFont;
  effect: EffectKey;
  accent: string;
  swatch: string;
  sampleTitle: string;
  sampleVenue: string;
  sampleTime: string;
  sampleFee: string;
}

export const EVENT_THEME_PRESETS: EventThemePreset[] = [
  // SPORTS (3)
  {
    id: "sports-floodlight",
    category: "SPORTS",
    name: "Floodlight",
    vibe: "Bold match-day stripe",
    style: "diagonal",
    font: "loud",
    effect: "sports",
    accent: "orange",
    swatch: "#D6652A",
    sampleTitle: "Box Cricket Finals",
    sampleVenue: "North Floodlight Turf",
    sampleTime: "Sun, 5:30 pm IST",
    sampleFee: "₹150 / team",
  },
  {
    id: "sports-varsity",
    category: "SPORTS",
    name: "Varsity Classic",
    vibe: "Collegiate ruled paper",
    style: "ruled",
    font: "classic",
    effect: "none",
    accent: "green",
    swatch: "#1F6E58",
    sampleTitle: "Inter-College Badminton",
    sampleVenue: "Indoor Court 2",
    sampleTime: "Sat, 9:00 am IST",
    sampleFee: "₹100",
  },
  {
    id: "sports-nightturf",
    category: "SPORTS",
    name: "Night Turf",
    vibe: "High-stakes finals glow",
    style: "spotlight",
    font: "loud",
    effect: "fire",
    accent: "red",
    swatch: "#E3264F",
    sampleTitle: "Midnight 5v5 Futsal",
    sampleVenue: "Main Arena Ground",
    sampleTime: "Fri, 9:00 pm IST",
    sampleFee: "₹200 / squad",
  },

  // TECH & HACKATHONS (3)
  {
    id: "tech-blueprint",
    category: "TECH",
    name: "Blueprint Lab",
    vibe: "Engineering graph & spec",
    style: "grid",
    font: "mono",
    effect: "code",
    accent: "blue",
    swatch: "#2346A8",
    sampleTitle: "HackNight '26",
    sampleVenue: "Main Auditorium",
    sampleTime: "Fri, 6:00 pm IST",
    sampleFee: "Free",
  },
  {
    id: "tech-demoday",
    category: "TECH",
    name: "Demo Day",
    vibe: "Crisp Swiss dot matrix",
    style: "dots",
    font: "modern",
    effect: "sparkles",
    accent: "violet",
    swatch: "#4634F0",
    sampleTitle: "AI Builders Showcase",
    sampleVenue: "Innovation Centre",
    sampleTime: "Sat, 4:00 pm IST",
    sampleFee: "Free",
  },
  {
    id: "tech-sprint",
    category: "TECH",
    name: "Ship Sprint",
    vibe: "High-voltage 24h build",
    style: "plain",
    font: "loud",
    effect: "fire",
    accent: "teal",
    swatch: "#11796D",
    sampleTitle: "24h FinTech Jam",
    sampleVenue: "Block C Atrium",
    sampleTime: "Sat, 10:00 am IST",
    sampleFee: "₹99",
  },

  // CULTURAL (3)
  {
    id: "cultural-diya",
    category: "CULTURAL",
    name: "Diya Courtyard",
    vibe: "Warm festive stage glow",
    style: "spotlight",
    font: "italic",
    effect: "diyas",
    accent: "orange",
    swatch: "#D6652A",
    sampleTitle: "Garba Under Stars",
    sampleVenue: "Central Quad",
    sampleTime: "Sat, 8:00 pm IST",
    sampleFee: "₹199",
  },
  {
    id: "cultural-velvet",
    category: "CULTURAL",
    name: "Velvet Stage",
    vibe: "Recital & theatre serif",
    style: "plain",
    font: "italic",
    effect: "sparkles",
    accent: "pink",
    swatch: "#C7457A",
    sampleTitle: "Acoustic Open Mic",
    sampleVenue: "Amphitheatre Steps",
    sampleTime: "Thu, 6:30 pm IST",
    sampleFee: "Free",
  },
  {
    id: "cultural-broadsheet",
    category: "CULTURAL",
    name: "Fest Broadsheet",
    vibe: "Editorial ruled poster",
    style: "ruled",
    font: "classic",
    effect: "confetti",
    accent: "violet",
    swatch: "#5A3BA8",
    sampleTitle: "Annual Cultural Night",
    sampleVenue: "Main Lawn Stage",
    sampleTime: "Sun, 7:00 pm IST",
    sampleFee: "₹149",
  },

  // PARTIES & MUSIC (3)
  {
    id: "party-afterhours",
    category: "PARTY",
    name: "Afterhours",
    vibe: "Concert & DJ spotlight",
    style: "spotlight",
    font: "loud",
    effect: "music",
    accent: "violet",
    swatch: "#5A3BA8",
    sampleTitle: "Sunset Sessions",
    sampleVenue: "Riverside Lawn",
    sampleTime: "Sat, 7:30 pm IST",
    sampleFee: "₹249",
  },
  {
    id: "party-golden",
    category: "PARTY",
    name: "Golden Hour",
    vibe: "Warm sunset editorial",
    style: "plain",
    font: "italic",
    effect: "sparkles",
    accent: "orange",
    swatch: "#D6652A",
    sampleTitle: "Rooftop Vinyl Mix",
    sampleVenue: "Terrace Deck",
    sampleTime: "Fri, 6:00 pm IST",
    sampleFee: "₹199",
  },
  {
    id: "party-confetti",
    category: "PARTY",
    name: "Freshers Night",
    vibe: "Playful celebratory dots",
    style: "dots",
    font: "modern",
    effect: "confetti",
    accent: "pink",
    swatch: "#E3264F",
    sampleTitle: "Welcome Batch '26",
    sampleVenue: "Grand Courtyard",
    sampleTime: "Sat, 8:30 pm IST",
    sampleFee: "₹299",
  },

  // WORKSHOPS (3)
  {
    id: "workshop-notebook",
    category: "WORKSHOP",
    name: "Studio Notebook",
    vibe: "Calm ruled craft pad",
    style: "ruled",
    font: "modern",
    effect: "none",
    accent: "green",
    swatch: "#2E6F40",
    sampleTitle: "Design Systems Lab",
    sampleVenue: "Studio 2, Block B",
    sampleTime: "Tue, 4:00 pm IST",
    sampleFee: "Free",
  },
  {
    id: "workshop-critique",
    category: "WORKSHOP",
    name: "Design Critique",
    vibe: "Dot grid & classic serif",
    style: "dots",
    font: "classic",
    effect: "sparkles",
    accent: "blue",
    swatch: "#2F5192",
    sampleTitle: "Typography Clinic",
    sampleVenue: "Design Wing 104",
    sampleTime: "Wed, 3:30 pm IST",
    sampleFee: "Free",
  },
  {
    id: "workshop-maker",
    category: "WORKSHOP",
    name: "Maker Bench",
    vibe: "Blueprint hardware lab",
    style: "grid",
    font: "mono",
    effect: "code",
    accent: "orange",
    swatch: "#B84A39",
    sampleTitle: "PCB & Robotics Lab",
    sampleVenue: "Mechatronics Bay",
    sampleTime: "Sat, 11:00 am IST",
    sampleFee: "₹120",
  },

  // GAMING (3)
  {
    id: "gaming-arena",
    category: "GAMING",
    name: "LAN Arena",
    vibe: "Tournament grid & fire",
    style: "grid",
    font: "loud",
    effect: "fire",
    accent: "teal",
    swatch: "#11796D",
    sampleTitle: "Valorant LAN Cup",
    sampleVenue: "CS Lab 3",
    sampleTime: "Sat, 2:00 pm IST",
    sampleFee: "₹100",
  },
  {
    id: "gaming-spec",
    category: "GAMING",
    name: "Arcade Spec",
    vibe: "Monospace dot matrix",
    style: "dots",
    font: "mono",
    effect: "code",
    accent: "violet",
    swatch: "#5A3BA8",
    sampleTitle: "Retro Console Night",
    sampleVenue: "Student Lounge",
    sampleTime: "Fri, 7:00 pm IST",
    sampleFee: "Free",
  },
  {
    id: "gaming-finals",
    category: "GAMING",
    name: "Grand Finals",
    vibe: "Diagonal championship",
    style: "diagonal",
    font: "loud",
    effect: "confetti",
    accent: "red",
    swatch: "#E3264F",
    sampleTitle: "FIFA Knockout Finals",
    sampleVenue: "Auditorium Screen",
    sampleTime: "Sun, 4:00 pm IST",
    sampleFee: "₹150",
  },

  // TALKS (3)
  {
    id: "talk-fireside",
    category: "TALK",
    name: "Fireside",
    vibe: "Intimate editorial serif",
    style: "plain",
    font: "classic",
    effect: "none",
    accent: "red",
    swatch: "#B83232",
    sampleTitle: "Founders Fireside",
    sampleVenue: "Seminar Hall A",
    sampleTime: "Thu, 5:00 pm IST",
    sampleFee: "Free",
  },
  {
    id: "talk-keynote",
    category: "TALK",
    name: "Keynote",
    vibe: "Crisp conference dots",
    style: "dots",
    font: "modern",
    effect: "none",
    accent: "blue",
    swatch: "#2346A8",
    sampleTitle: "Future of Systems",
    sampleVenue: "Lecture Theatre 1",
    sampleTime: "Wed, 5:30 pm IST",
    sampleFee: "Free",
  },
  {
    id: "talk-salon",
    category: "TALK",
    name: "Evening Salon",
    vibe: "Ruled literary italic",
    style: "ruled",
    font: "italic",
    effect: "none",
    accent: "violet",
    swatch: "#5A3BA8",
    sampleTitle: "Cinema & Storytelling",
    sampleVenue: "Library Courtyard",
    sampleTime: "Fri, 6:00 pm IST",
    sampleFee: "Free",
  },
];

export function presetsForCategory(category: string | null | undefined): EventThemePreset[] {
  const code = (category ?? "").toUpperCase();
  const matched = EVENT_THEME_PRESETS.filter((p) => p.category === code);
  return matched.length > 0 ? matched : EVENT_THEME_PRESETS.slice(0, 6);
}
