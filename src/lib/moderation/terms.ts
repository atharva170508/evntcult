/**
 * Blocked terms for EvntCult's content filter (Synchronous Labs platform guidelines).
 *
 * This file is a deny-list, so it necessarily contains offensive words. They are here only to be
 * blocked. Every term is matched after the same normalisation as user text (see normalize.ts), so
 * write each one plainly, in lower case, without spaces, symbols or leetspeak.
 *
 * Two kinds of match:
 *  - WORDS: matched as whole words (and common endings: s, es, ed, er, ers, ing, y), including when
 *    split up ("d r u g s", "dr-ugs"). Safe for short or ambiguous words: "ass" never matches
 *    "class" or "assistant", "drug" never matches "drugstore receipts" (whole word "drugstore").
 *  - STEMS: matched anywhere, even inside longer words and across spaces/symbols. Only for strong
 *    terms with no innocent words containing them ("motherfucking", "f.u.c.k.e.r").
 *
 * Categories: abuse and profanity, slurs, and prohibited subjects (drugs) in English, Hindi and
 * Marathi, the last two both romanised (as students type them) and in Devanagari.
 *
 * To add a term: put it in the right list in plain lower case, then run `npx vitest run tests/moderation.test.ts`.
 */

/** Strong terms: blocked anywhere, inside words and across separators. Keep these unambiguous. */
export const STEMS: readonly string[] = [
  // English
  "fuck", "fuk", "fck", "motherfuck", "bullshit", "dipshit", "asshole", "arsehole", "bitch", "bastard", "wanker", "dickhead",
  "nigger", "nigga", "faggot", "retarded",
  // Hindi / Marathi, romanised
  "bhenchod", "behenchod", "bahenchod", "benchod", "madarchod", "maderchod", "madarjaat", "chutiya", "chutiye", "chutia", "bhosdi", "bhosda",
  "bhosdike", "lavda", "lauda", "lawda", "lavdya", "gandu", "gaandu", "harami", "haramkhor", "bhadwa", "bhadve", "bhadvya",
  "chinal", "jhaat", "zavadya", "zhavadya", "zavlya", "aighalya", "aaighalya",
  // Devanagari
  "भेनचोद", "बहनचोद", "बहेनचोद", "मादरचोद", "चूतिया", "चुतिया", "चूतिये", "भोसडी", "भोसडा", "भोसड़ी", "लौड़ा", "लौडा", "लवडा", "लवड्या",
  "गांडू", "गांडु", "हरामी", "हरामखोर", "भडवा", "भड़वा", "भडव्या", "रंडी", "छिनाल", "झाट", "झवाड्या", "आईघाल्या",
];

/** Whole-word terms: blocked as words (with endings), including when spaced or split. */
export const WORDS: readonly string[] = [
  // English: abuse and profanity
  "shit", "shitty", "ass", "arse", "dick", "cock", "pussy", "cunt", "twat", "prick", "slut", "whore", "hoe", "piss", "porn", "porno",
  "nude", "nudes", "boob", "boobs", "tits", "wank", "jerkoff", "dildo", "milf", "rape", "rapist", "retard",
  // English: slurs
  "fag", "chink", "paki", "kike", "spic", "coon", "tranny", "dyke", "gook", "wetback", "raghead",
  // Hindi / Marathi, romanised
  "chut", "lund", "gaand", "gand", "kutiya", "kamina", "kamine", "kaminey", "suar", "bsdk", "bkl", "mkc", "tatti",
  "zav", "zhav", "randi", "raand", "laude", "zavla", "zavli",
  // Devanagari
  "चूत", "लंड", "लौड़े", "गांड", "कुतिया", "कमीना", "कमीने", "सूअर", "टट्टी", "झवला", "झवली",
  // Prohibited subjects: drugs
  "drug", "drugs", "narcotic", "narcotics", "weed", "ganja", "charas", "cocaine", "heroin", "meth", "mdma", "ecstasy", "lsd", "cannabis",
  "marijuana", "hashish", "opium", "afeem", "nasha", "chitta", "brownsugar", "bong",
  "गांजा", "चरस", "अफीम", "नशा", "ड्रग", "ड्रग्स",
];
