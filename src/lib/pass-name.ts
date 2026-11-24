/**
 * Every pass gets a memorable call sign — like "Velvet Comet" or "Midnight Phoenix" — plus its
 * ticket number ("No. 0813"). Door staff can actually say a name; nobody wants "EC-2098".
 *
 * The call sign is derived deterministically from the pass number using a bijection mod 4096
 * (64 × 64), so passes 1, 2, 3 don't cluster together and every number below 4096 gets a unique
 * name within an event. Past 4096 a numeral is added ("Velvet Comet 2").
 */

const ADJ = [
  "Amber", "Astral", "Blazing", "Breezy", "Chrome", "Cobalt", "Copper", "Coral",
  "Cosmic", "Crimson", "Crystal", "Daring", "Dawn", "Drift", "Electric", "Ember",
  "Emerald", "Fierce", "Frost", "Gilded", "Golden", "Grand", "Hyper", "Indigo",
  "Ivory", "Jade", "Laser", "Lucid", "Lunar", "Marble", "Midnight", "Misty",
  "Neon", "Noble", "Obsidian", "Ocean", "Onyx", "Opal", "Pearl", "Phantom",
  "Plum", "Polar", "Prism", "Radiant", "Rapid", "Rose", "Royal", "Ruby",
  "Saffron", "Sapphire", "Scarlet", "Shadow", "Silver", "Solar", "Sonic", "Stellar",
  "Stormy", "Sunny", "Swift", "Teal", "Velvet", "Violet", "Vivid", "Wild",
] as const;

const NOUN = [
  "Comet", "Falcon", "Tiger", "Lotus", "Phoenix", "Raven", "Fox", "Wolf",
  "Aurora", "Apex", "Lynx", "Orca", "Owl", "Mirage", "Peacock", "Puma",
  "Vortex", "Sparrow", "Swan", "Drifter", "Raptor", "Titan", "Zenith", "Cipher",
  "Nomad", "Cobra", "Dolphin", "Eagle", "Vinyl", "Hawk", "Jaguar", "Kestrel",
  "Lion", "Horizon", "Narwhal", "Panther", "Zephyr", "Beacon", "Prism", "Voyager",
  "Shark", "Stag", "Starling", "Nebula", "Catalyst", "Meteor", "Quasar", "Solstice",
  "Nova", "Orbit", "Rocket", "Pulse", "Echo", "Rhythm", "Tempo", "Spark",
  "Lantern", "Harbor", "Summit", "Canyon", "River", "Galaxy", "Glacier", "Monsoon",
] as const;

const SPACE = ADJ.length * NOUN.length; // 4096
const MIX = 1597; // odd, so multiplying by it mod 4096 is a permutation
const UNMIX = (() => {
  for (let i = 1; i < SPACE; i += 2) if ((i * MIX) % SPACE === 1) return i;
  return 1;
})();

function nameFor(seq: number): string {
  const lap = Math.floor(seq / SPACE);
  const idx = ((seq % SPACE) * MIX) % SPACE;
  const base = `${ADJ[idx % ADJ.length]} ${NOUN[Math.floor(idx / ADJ.length)]}`;
  return lap ? `${base} ${lap + 1}` : base;
}

export type PassName = { name: string; no: string; label: string };

/**
 * Generates an interesting human-readable pass code from a sequence number,
 * e.g. 42 -> "VELVET-COMET-0042" (instead of boring "EC-2098").
 */
export function passCallSignCode(sequence: number): string {
  const seq = Math.max(0, Math.floor(sequence));
  const slug = nameFor(seq).toUpperCase().replace(/\s+/g, "-");
  return `${slug}-${String(seq).padStart(4, "0")}`;
}

/**
 * Accepts either new call-sign codes ("VELVET-COMET-0813") or legacy codes ("EC-ROBO-0813")
 * and returns { name: "Velvet Comet", no: "0813", label: "Velvet Comet, No. 0813" }.
 */
export function passName(code: string | null | undefined): PassName {
  const m = /(\d+)$/.exec(code ?? "");
  if (!m) return { name: code ?? "", no: "", label: code ?? "" };
  const seq = Number(m[1]);
  const name = nameFor(seq);
  const no = m[1].padStart(4, "0");
  return { name, no, label: `${name}, No. ${no}` };
}

/** "velvet comet" or "Velvet Comet 2" -> the pass number it names, or null. Used by attendee search. */
export function seqFromPassName(q: string): number | null {
  const w = q.trim().toLowerCase().split(/\s+/);
  if (w.length < 2 || w.length > 3) return null;
  const a = ADJ.findIndex((x) => x.toLowerCase() === w[0]);
  const n = NOUN.findIndex((x) => x.toLowerCase() === w[1]);
  if (a < 0 || n < 0) return null;
  const lap = w[2] ? Number(w[2]) - 1 : 0;
  if (!Number.isInteger(lap) || lap < 0) return null;
  const idx = n * ADJ.length + a;
  return lap * SPACE + ((idx * UNMIX) % SPACE);
}
