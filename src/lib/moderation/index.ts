/**
 * EvntCult's content filter: blocks abusive language, slurs and prohibited terms (such as drugs)
 * in English, Hindi and Marathi, written in Latin letters or Devanagari.
 *
 * Shared by the server (the real guard) and forms (instant feedback). Plain TypeScript, no I/O.
 *
 * Bypass resistance: before matching, text is normalised so that these all count as the same word:
 *   "drugs", "DRUGS", "d r u g s", "d.r.u.g.s", "dr-ugs", "drrruuuugs", "dr​ugs" (zero-width),
 *   "dr0gs"→no, "drüg$" (accents, $→s), "ｄｒｕｇｓ" (full-width), "𝐝𝐫𝐮𝐠𝐬" (styled), "drцgs" (Cyrillic look-alike).
 * Leetspeak: 0→o, 1/!/|→i (and l), 3→e, 4/@→a, 5/$→s, 7/+→t, 8→b, 9/6→g.
 *
 * And so that innocent words are left alone: "class", "assistant", "Scunthorpe", "grandiose",
 * "cocktail", "Dickens", "Hasselhoff", "assess" and "Sussex" all pass, because short or ambiguous
 * terms only match as whole words (see terms.ts).
 */
import { STEMS, WORDS } from "./terms";

/* ── Normalisation ─────────────────────────────────────────────────────────────────────────── */

const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠋-᠎​-‏‪-‮⁠-⁯ㅤ︀-️﻿ﾠ]/g;

/** Look-alike letters from other scripts, mapped to the Latin letter they imitate. */
const HOMOGLYPHS: Record<string, string> = {
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", к: "k", м: "m", т: "t", в: "b", н: "h", і: "i", ј: "j", ѕ: "s", ԁ: "d", ц: "u", ɡ: "g",
  α: "a", ε: "e", ο: "o", ρ: "p", τ: "t", υ: "u", ι: "i", κ: "k", ν: "v",
};

/** Digits are always read as letters; symbols only in the "symbols are letters" pass. */
const LEET_DIGITS: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "6": "g", "7": "t", "8": "b", "9": "g" };
const LEET_SYMBOLS: Record<string, string> = { "!": "i", "|": "i", "@": "a", $: "s", "+": "t", "€": "e", "£": "l", "¡": "i" };

/**
 * Case, width, styling, accents, invisible characters and look-alikes, all folded away.
 * Devanagari: nukta dropped (ड़ = ड) and chandrabindu read as anusvara, so spelling variants match.
 */
export function baseNormalize(text: string): string {
  let s = text.normalize("NFKC").toLowerCase().replace(INVISIBLE, "");
  s = [...s].map((c) => HOMOGLYPHS[c] ?? c).join("");
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC"); // Latin accents only
  return s.replace(/़/g, "").replace(/ँ/g, "ं");
}

/** "drrruuugs" → "drugs". */
export const collapseRepeats = (s: string) => s.replace(/(.)\1+/gu, "$1");

const SEP = /[^\p{L}\p{M}\p{N}]+/u;

/** The text as word lists, read a few ways: symbols as letters or as gaps, and 1/| as i or l. */
function readings(text: string): string[][] {
  const base = baseNormalize(text);
  const out: string[][] = [];
  for (const symbolsAreLetters of [false, true]) {
    for (const one of ["i", "l"]) {
      const mapped = [...base]
        .map((c) => {
          if (c === "1" || (symbolsAreLetters && c === "|")) return one;
          if (LEET_DIGITS[c]) return LEET_DIGITS[c];
          if (symbolsAreLetters && LEET_SYMBOLS[c]) return LEET_SYMBOLS[c];
          return c;
        })
        .join("");
      out.push(mapped.split(SEP).filter(Boolean));
    }
  }
  return out;
}

/* ── Term index ────────────────────────────────────────────────────────────────────────────── */

// No "-er": "cocker" (spaniel) and "dicker" are innocent; strong "-er" words (fucker, wanker) are stems.
const ENDINGS = ["", "s", "es", "ed", "ing", "in", "y", "ie", "ies", "e"];
// With repeated letters squashed, only short endings: otherwise "assess" reads as "ass" + "es".
const COLLAPSED_ENDINGS = ["", "s", "y"];
const clean = (t: string) => baseNormalize(t).replace(/\s+/g, "");

const WORD_FORMS = new Map<string, string>(); // form → term
const WORD_FORMS_COLLAPSED = new Map<string, string>();
for (const raw of WORDS) {
  const w = clean(raw);
  for (const e of ENDINGS) WORD_FORMS.set(w + e, raw);
  for (const e of COLLAPSED_ENDINGS) WORD_FORMS_COLLAPSED.set(collapseRepeats(w + e), raw);
}
const STEM_LIST = STEMS.map((raw) => ({ raw, s: clean(raw), c: collapseRepeats(clean(raw)) }));

/** Is this single word (already normalised) blocked? Returns the term it matched. */
function wordHit(t: string): string | null {
  const exact = WORD_FORMS.get(t);
  if (exact) return exact;
  const c = collapseRepeats(t);
  if (c !== t) {
    // Only when the word itself had repeated letters ("shiiit"), so "as" never matches "ass".
    const hit = WORD_FORMS_COLLAPSED.get(c);
    if (hit) return hit;
  }
  for (const st of STEM_LIST) {
    if (t.includes(st.s)) return st.raw;
    if (c !== t && c.includes(st.c)) return st.raw;
  }
  return null;
}

/** A run of pieces glued back together ("f", "uck" → "fuck"). Only exact words or stem+ending. */
function joinedHit(joined: string, allTiny: boolean): string | null {
  const exact = WORD_FORMS.get(joined) ?? WORD_FORMS_COLLAPSED.get(collapseRepeats(joined));
  if (exact) return exact;
  for (const st of STEM_LIST) {
    // Spelled out letter by letter ("f u c k i n g"): the stem anywhere in it.
    if (allTiny && (joined.includes(st.s) || collapseRepeats(joined).includes(st.c))) return st.raw;
    if (joined.startsWith(st.s) && ENDINGS.includes(joined.slice(st.s.length))) return st.raw;
  }
  return null;
}

/* ── Public API ────────────────────────────────────────────────────────────────────────────── */

/** The blocked term found in `text`, or null if it's clean. */
export function findBlocked(text: string | null | undefined): string | null {
  if (!text || !text.trim()) return null;
  for (const words of readings(text)) {
    for (const t of words) {
      const hit = wordHit(t);
      if (hit) return hit;
    }
    // Words split up to dodge the filter: "dr ugs", "a ss", "d.r.u.g.s", "f u c k".
    // Windows of 2 to 6 neighbouring pieces where at least one piece is tiny (3 letters or fewer).
    for (let i = 0; i < words.length; i++) {
      let joined = words[i];
      let anyTiny = words[i].length <= 3;
      let allTiny = words[i].length <= 3;
      for (let j = i + 1; j < Math.min(words.length, i + 6); j++) {
        joined += words[j];
        anyTiny ||= words[j].length <= 3;
        allTiny &&= words[j].length <= 3;
        if (!anyTiny) continue;
        const hit = joinedHit(joined, allTiny);
        if (hit) return hit;
      }
    }
    // Long letter-by-letter runs ("d . r . u . g . s . a . r . e . h . e . r . e").
    let run = "";
    for (const t of [...words, ""]) {
      if (t.length === 1) {
        run += t;
        continue;
      }
      if (run.length >= 3) {
        const hit = joinedHit(run, true) ?? [...WORD_FORMS.keys()].find((f) => f.length >= 4 && run.includes(f));
        if (hit) return WORD_FORMS.get(hit) ?? hit;
      }
      run = "";
    }
  }
  return null;
}

/** Why something was refused, in words people understand. Used by the server and the forms. */
export function blockedMessage(label: string) {
  return `${label} contains language that isn't allowed on EvntCult. Please remove it: this content violates the platform guidelines.`;
}

/**
 * Check several labelled fields at once. Returns the first problem, or null.
 * Example: firstBlocked({ "Event name": title, "Description": description })
 */
export function firstBlocked(fields: Record<string, string | null | undefined>): { field: string; term: string; message: string } | null {
  for (const [field, value] of Object.entries(fields)) {
    const term = findBlocked(value);
    if (term) return { field, term, message: blockedMessage(field) };
  }
  return null;
}
