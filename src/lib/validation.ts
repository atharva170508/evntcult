import { z } from "zod";

export const slotSchema = z
  .object({
    eventId: z.string().optional(),
    venueId: z.string().min(1).nullable(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    category: z.string().optional(),
    expectedAttendance: z.number().int().positive().optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "End time must be after start time.", path: ["endsAt"] });

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    tagline: z.string().trim().max(160).optional(),
    description: z.string().trim().min(10).max(10_000),
    category: z.enum(["FEST", "PARTY", "SPORTS", "GAMING", "TECH", "CULTURAL", "WORKSHOP", "TALK", "OTHER"]),
    visibility: z.enum(["PUBLIC", "CODE_ONLY", "UNLISTED"]).default("PUBLIC"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    venueId: z.string().nullable(),
    venueOverride: z.string().max(200).optional(),
    capacity: z.number().int().positive().max(100_000).optional(),
    feeAmountPaise: z.number().int().min(0).max(10_000_00).default(0),
    upiVpa: z
      .string()
      .regex(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/, "Enter a valid UPI ID like club@okaxis")
      .optional(),
    publish: z.boolean().default(false),
    /** Acknowledge soft clashes to publish anyway. Hard clashes can't be overridden. */
    acknowledgeSoftClashes: z.boolean().default(false),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "End time must be after start time.", path: ["endsAt"] })
  .refine((v) => v.venueId || v.venueOverride, { message: "Pick a venue.", path: ["venueId"] });

export const redeemCodeSchema = z.object({ code: z.string().min(4).max(20) });
