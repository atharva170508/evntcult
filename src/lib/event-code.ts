import { randomInt } from "node:crypto";

/**
 * Google-Classroom-style event codes.
 * 7 chars from an alphabet with no look-alikes (no 0/O, 1/I/L, 5/S, 2/Z, 8/B),
 * so codes survive being read off a projector or shouted across a hall.
 * 25^7 ≈ 6.1 billion combinations.
 */
export const CODE_ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";
export const CODE_LENGTH = 7;

export function generateEventCode(length = CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

/** Normalise what a user typed: trim, uppercase, drop spaces/dashes. */
export function normalizeEventCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isWellFormedEventCode(input: string): boolean {
  const code = normalizeEventCode(input);
  if (code.length !== CODE_LENGTH) return false;
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return false;
  return true;
}

export type CodeCheck =
  | { ok: true }
  | { ok: false; reason: "inactive" | "expired" | "exhausted" };

/** Pure validity check for a code row loaded from the database. */
export function checkCodeUsable(
  code: { active: boolean; expiresAt: Date | null; maxUses: number | null; uses: number },
  now: Date = new Date(),
): CodeCheck {
  if (!code.active) return { ok: false, reason: "inactive" };
  if (code.expiresAt && code.expiresAt <= now) return { ok: false, reason: "expired" };
  if (code.maxUses !== null && code.uses >= code.maxUses) return { ok: false, reason: "exhausted" };
  return { ok: true };
}
