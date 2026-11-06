import { z } from "zod";

/**
 * Indian mobile numbers only for now. Accepts "98765 43210", "+91-98765-43210",
 * "09876543210" and stores "+919876543210". Mobiles start with 6, 7, 8 or 9.
 */
export function normalizeIndianMobile(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, "");
  if (d.startsWith("+91")) d = d.slice(3);
  else if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

export const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .transform((v, ctx) => {
    const n = normalizeIndianMobile(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a 10-digit Indian mobile number." });
      return z.NEVER;
    }
    return n;
  });

/** +919876543210 -> "+91 98765 43210" */
export function formatPhone(e164: string): string {
  const d = e164.replace(/^\+91/, "");
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
