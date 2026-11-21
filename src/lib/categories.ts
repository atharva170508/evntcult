/**
 * Category-adaptive events. Every event keeps the same core (title, date, venue, price), and its
 * category picks a "kind" that adds its own setup fields, recommended registration questions,
 * badges on the event page and pass, and what the organizer dashboard counts.
 *
 * Adding a kind or a category is config only: add an entry to KINDS and map categories to it.
 */

export type KindKey = "hackathon" | "tournament" | "party" | "workshop";

export type Field =
  | {
      key: string;
      type: "range";
      label: string;
      min: number;
      max: number;
      unit: string;
      hint?: string;
    }
  | {
      key: string;
      type: "tags";
      label: string;
      suggestions: string[];
      max: number;
      hint?: string;
    }
  | { key: string; type: "choice"; label: string; options: [string, string][] }
  | {
      key: string;
      type: "text";
      label: string;
      placeholder: string;
      max: number;
    }
  | {
      key: string;
      type: "lines";
      label: string;
      placeholder: string;
      max: number;
      hint?: string;
    }
  | { key: string; type: "toggle"; label: string; hint?: string };

export interface PresetQuestion {
  label: string;
  kind: "text" | "choice";
  options?: string[];
  required: boolean;
}

export interface Kind {
  key: KindKey;
  name: string;
  /** Shown above the setup fields. */
  blurb: string;
  fields: Field[];
  questions: PresetQuestion[];
  /** Question labels (lower-case fragments) whose answers belong on the pass, in order. */
  passBadges: string[];
  /** The question whose answers split the crowd on the dashboard, if any. */
  splitBy?: string;
  /** Whether attendees form teams the dashboard should group. */
  teams: boolean;
}

const FOOD: PresetQuestion = {
  label: "Food preference",
  kind: "choice",
  options: ["Veg", "Non-veg", "Jain", "Vegan", "Eggetarian"],
  required: true,
};
const TEE: PresetQuestion = {
  label: "T-shirt size",
  kind: "choice",
  options: ["XS", "S", "M", "L", "XL", "XXL"],
  required: true,
};
const TEAM: PresetQuestion = {
  label: "Team name",
  kind: "text",
  required: true,
};

export const KINDS: Record<KindKey, Kind> = {
  hackathon: {
    key: "hackathon",
    name: "Hackathon or tech fest",
    blurb: "Teams, tracks and the logistics of an overnight build.",
    fields: [
      {
        key: "teamSize",
        type: "range",
        label: "Team size",
        min: 1,
        max: 6,
        unit: "people",
        hint: "Teams outside this range show as incomplete on your dashboard.",
      },
      {
        key: "tracks",
        type: "tags",
        label: "Tracks",
        suggestions: [
          "AI / ML",
          "Web3",
          "FinTech",
          "HealthTech",
          "Open innovation",
          "Sustainability",
        ],
        max: 8,
      },
      {
        key: "overnight",
        type: "toggle",
        label: "Runs overnight",
        hint: "Shows an Overnight badge, and reminds you to plan meals.",
      },
      {
        key: "prizes",
        type: "text",
        label: "Prize pool",
        placeholder: "₹50,000 in prizes",
        max: 60,
      },
    ],
    questions: [
      TEAM,
      { label: "Track", kind: "choice", options: [], required: true },
      { label: "GitHub or LinkedIn", kind: "text", required: false },
      FOOD,
      TEE,
    ],
    passBadges: ["team", "track", "food", "t-shirt"],
    teams: true,
  },
  tournament: {
    key: "tournament",
    name: "Sports or tournament",
    blurb:
      "Squads, a format everyone can read at a glance, and captains at the gate.",
    fields: [
      {
        key: "format",
        type: "tags",
        label: "Format",
        suggestions: [
          "6v6 Turf",
          "8 overs box cricket",
          "5-a-side",
          "Knockout",
          "League",
          "Best of 3",
          "Solo",
          "Duo",
          "Squad",
        ],
        max: 4,
      },
      {
        key: "squadSize",
        type: "range",
        label: "Squad size",
        min: 1,
        max: 15,
        unit: "players",
        hint: "Squads with fewer players show as incomplete.",
      },
      {
        key: "entry",
        type: "choice",
        label: "Who registers",
        options: [
          ["team", "One entry per team"],
          ["player", "Each player"],
        ],
      },
      {
        key: "prizes",
        type: "text",
        label: "Prize pool",
        placeholder: "₹10,000 for the winners",
        max: 60,
      },
    ],
    questions: [
      { label: "Team name", kind: "text", required: true },
      {
        label: "Role",
        kind: "choice",
        options: [
          "Batter",
          "Bowler",
          "All-rounder",
          "Wicket-keeper",
          "Captain",
        ],
        required: false,
      },
      { label: "Jersey number", kind: "text", required: false },
    ],
    passBadges: ["team", "role", "jersey"],
    teams: true,
  },
  party: {
    key: "party",
    name: "Party, gig or social",
    blurb: "The vibe, who can get in, and how the door counts the crowd.",
    fields: [
      {
        key: "age",
        type: "choice",
        label: "Age limit",
        options: [
          ["none", "All ages"],
          ["18", "18+"],
          ["21", "21+"],
        ],
      },
      {
        key: "dress",
        type: "text",
        label: "Dress code",
        placeholder: "All black, neon accents",
        max: 60,
      },
      {
        key: "lineup",
        type: "lines",
        label: "Lineup",
        placeholder: "DJ Arjun, 9 pm\nThe Night Shift (live), 10:30 pm",
        max: 8,
        hint: "One act per line.",
      },
      {
        key: "vibe",
        type: "tags",
        label: "Vibe",
        suggestions: [
          "Bollywood",
          "EDM",
          "Techno",
          "Indie",
          "Retro",
          "Garba",
          "Open mic",
        ],
        max: 4,
      },
    ],
    questions: [
      {
        label: "Pass type",
        kind: "choice",
        options: ["Stag", "Couple", "Group"],
        required: true,
      },
    ],
    passBadges: ["pass type"],
    splitBy: "pass type",
    teams: false,
  },
  workshop: {
    key: "workshop",
    name: "Workshop, talk or meetup",
    blurb: "Who's speaking, what to bring, and a certificate at the end.",
    fields: [
      {
        key: "speakers",
        type: "lines",
        label: "Speakers",
        placeholder:
          "Priya Rao, Building with LLMs\nKabir Shah, Shipping your first app",
        max: 6,
        hint: "Name, then topic, one per line.",
      },
      { key: "laptop", type: "toggle", label: "Bring a laptop" },
      {
        key: "prereq",
        type: "text",
        label: "Before you come",
        placeholder: "Install Node 20 and VS Code",
        max: 140,
      },
      {
        key: "level",
        type: "choice",
        label: "Level",
        options: [
          ["any", "Anyone"],
          ["beginner", "Beginner"],
          ["intermediate", "Intermediate"],
          ["advanced", "Advanced"],
        ],
      },
    ],
    questions: [
      {
        label: "Experience level",
        kind: "choice",
        options: ["New to this", "Some experience", "Experienced"],
        required: false,
      },
    ],
    passBadges: [],
    teams: false,
  },
};

/** Which kind each existing category uses. */
const BY_CATEGORY: Record<string, KindKey> = {
  TECH: "hackathon",
  SPORTS: "tournament",
  GAMING: "tournament",
  PARTY: "party",
  CULTURAL: "party",
  WORKSHOP: "workshop",
  TALK: "workshop",
};

export function kindFor(category: string | null | undefined): Kind | null {
  const k = category ? BY_CATEGORY[category] : undefined;
  return k ? KINDS[k] : null;
}

export type CategoryConfig = Record<
  string,
  string | number | boolean | string[] | [number, number]
>;

export function parseConfig(raw: string | null | undefined): CategoryConfig {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as CategoryConfig)
      : {};
  } catch {
    return {};
  }
}

/** Keep only fields this kind defines, with sane values. Untrusted input in, clean config out. */
export function cleanConfig(
  kind: Kind,
  input: Record<string, unknown>,
): CategoryConfig {
  const out: CategoryConfig = {};
  for (const f of kind.fields) {
    const v = input[f.key];
    if (v == null || v === "") continue;
    if (f.type === "range" && Array.isArray(v) && v.length === 2) {
      const a = Math.max(f.min, Math.min(f.max, Math.round(Number(v[0]))));
      const b = Math.max(a, Math.min(f.max, Math.round(Number(v[1]))));
      if (Number.isFinite(a) && Number.isFinite(b)) out[f.key] = [a, b];
    } else if (f.type === "tags" && Array.isArray(v)) {
      const tags = [
        ...new Set(v.map((t) => String(t).trim().slice(0, 40)).filter(Boolean)),
      ].slice(0, f.max);
      if (tags.length) out[f.key] = tags;
    } else if (
      f.type === "choice" &&
      typeof v === "string" &&
      f.options.some(([o]) => o === v)
    )
      out[f.key] = v;
    else if (f.type === "text" && typeof v === "string")
      out[f.key] = v.trim().slice(0, f.max);
    else if (f.type === "lines" && typeof v === "string") {
      const lines = v
        .split("\n")
        .map((l) => l.trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, f.max);
      if (lines.length) out[f.key] = lines.join("\n");
    } else if (f.type === "toggle" && typeof v === "boolean") out[f.key] = v;
  }
  return out;
}

/** Short pills for the event page header: "Team 2 to 4", "6v6 Turf", "18+", "Overnight". */
export function headlinePills(kind: Kind, c: CategoryConfig): string[] {
  const pills: string[] = [];
  const range = (v: unknown, unit: string) =>
    Array.isArray(v) && v.length === 2
      ? v[0] === v[1]
        ? `${v[0]} ${unit}`
        : `${v[0]} to ${v[1]} ${unit}`
      : null;
  if (kind.key === "hackathon") {
    const r = range(c.teamSize, "per team");
    if (r) pills.push(`Teams of ${r.replace(" per team", "")}`);
    if (c.overnight) pills.push("Overnight");
    if (typeof c.prizes === "string") pills.push(c.prizes);
  }
  if (kind.key === "tournament") {
    if (Array.isArray(c.format)) pills.push(...(c.format as string[]));
    const r = range(c.squadSize, "players");
    if (r) pills.push(`Squads of ${r}`);
    if (c.entry === "team") pills.push("Entry per team");
    if (typeof c.prizes === "string") pills.push(c.prizes);
  }
  if (kind.key === "party") {
    if (c.age === "18" || c.age === "21") pills.push(`${c.age}+ only`);
    if (typeof c.dress === "string") pills.push(`Dress code: ${c.dress}`);
    if (Array.isArray(c.vibe)) pills.push(...(c.vibe as string[]));
  }
  if (kind.key === "workshop") {
    if (c.level && c.level !== "any")
      pills.push(String(c.level).replace(/^\w/, (m) => m.toUpperCase()));
    if (c.laptop) pills.push("Bring a laptop");
  }
  return pills;
}

/** The team-size rule for grouping on the dashboard, if this kind has one. */
export function teamRule(
  kind: Kind | null,
  c: CategoryConfig,
): [number, number] | null {
  if (!kind?.teams) return null;
  const v = kind.key === "hackathon" ? c.teamSize : c.squadSize;
  return Array.isArray(v) && v.length === 2
    ? [Number(v[0]), Number(v[1])]
    : null;
}
