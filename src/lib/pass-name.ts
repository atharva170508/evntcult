/**
 * Every pass gets a name, like a call sign: "Velvet Comet", plus its ticket number ("No. 0813").
 * Door staff can say a name; nobody can say "EC-ROBO-0813".
 *
 * The name is worked out from the pass number, so nothing new is stored. The number is mixed by
 * multiplying with an odd constant modulo 4096 (a bijection), so passes 1, 2, 3 don't read as
 * Amber Badger, Bright Badger, Calm Badger, and every number below 4096 gets its own name within
 * an event. Past 4096 a numeral is added ("Velvet Comet 2").
 */

const ADJ = [
  "Amber", "Bright", "Calm", "Coral", "Cosmic", "Crimson", "Daring", "Dawn",
  "Electric", "Ember", "Feather", "Fierce", "Gentle", "Gilded", "Golden", "Grand",
  "Happy", "Indigo", "Ivory", "Jade", "Jolly", "Lucky", "Lunar", "Copper",
  "Marble", "Mellow", "Midnight", "Misty", "Neon", "Noble", "Ocean", "Olive",
  "Opal", "Pearl", "Plum", "Polar", "Quiet", "Radiant", "Rapid", "Rose",
  "Royal", "Ruby", "Rustic", "Saffron", "Sapphire", "Scarlet", "Silent", "Silver",
  "Solar", "Sonic", "Stellar", "Stormy", "Sunny", "Swift", "Teal", "Velvet",
  "Violet", "Vivid", "Wild", "Winter", "Witty", "Zesty", "Breezy", "Hazel",
] as const;

const NOUN = [
  "Comet", "Falcon", "Tiger", "Lotus", "Otter", "Panda", "Raven", "Fox",
  "Wolf", "Heron", "Koala", "Lynx", "Orca", "Owl", "Parrot", "Peacock",
  "Phoenix", "Puma", "Robin", "Sparrow", "Swan", "Turtle", "Whale", "Zebra",
  "Badger", "Bison", "Cobra", "Dolphin", "Eagle", "Gecko", "Hawk", "Jaguar",
  "Kestrel", "Lion", "Moose", "Narwhal", "Panther", "Pelican", "Penguin", "Rhino",
  "Seal", "Shark", "Stag", "Starling", "Tapir", "Toucan", "Meteor", "Yak",
  "Nova", "Orbit", "Rocket", "Pulse", "Echo", "Rhythm", "Tempo", "Spark",
  "Lantern", "Harbor", "Summit", "Canyon", "River", "Galaxy", "Glacier", "Monsoon",
] as const;

const SPACE = ADJ.length * NOUN.length; // 4096
const MIX = 1597; // odd, so multiplying by it mod 4096 is a permutation
const UNMIX = (() => {
  // modular inverse of MIX mod 4096
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

/** "EC-ROBO-0813" -> { name: "Velvet Comet", no: "0813", label: "Velvet Comet, No. 0813" }. */
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
