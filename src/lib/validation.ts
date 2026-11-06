import { z } from "zod";
import { CATEGORIES } from "@/lib/data/types";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

/** POST /api/events — times are entered in IST and stored as UTC. */
export const createEventSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(5000).optional(),
    category: z.enum(CATEGORIES),
    venue: z.string().trim().min(2).max(120),
    date: ymd,
    startTime: hm,
    endTime: hm,
    capacity: z.number().int().positive().max(100_000),
    pricePaise: z.number().int().min(0).max(10_000_00).default(0),
    access: z.enum(["public", "code"]).default("public"),
    publish: z.boolean().default(false),
    /** Soft clashes (same crowd, same time) need an explicit OK. Hard clashes can't be overridden. */
    acknowledgeSoftClashes: z.boolean().default(false),
  })
  .strict()
  .refine((v) => v.endTime > v.startTime, { message: "End time must be after start time.", path: ["endTime"] });

/** PATCH /api/events/:id — every field optional. */
export const patchEventSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    category: z.enum(CATEGORIES).optional(),
    venue: z.string().trim().min(2).max(120).optional(),
    date: ymd.optional(),
    startTime: hm.optional(),
    endTime: hm.optional(),
    capacity: z.number().int().positive().max(100_000).optional(),
    pricePaise: z.number().int().min(0).max(10_000_00).optional(),
    access: z.enum(["public", "code"]).optional(),
    status: z.enum(["draft", "published", "closed", "cancelled"]).optional(),
    acknowledgeSoftClashes: z.boolean().default(false),
  })
  .strict();

/** GET /api/events and the /events page. */
export const listQuerySchema = z.object({
  type: z.enum(CATEGORIES).optional(),
  when: z.enum(["today", "weekend", "week", "month"]).optional(),
  price: z.enum(["free", "paid"]).optional(),
  q: z.string().trim().max(80).optional(),
  cursor: z.string().max(200).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const unlockSchema = z.object({ code: z.string().trim().min(4).max(20) }).strict();

/** POST /api/events/:ref/register — `waitlist: true` = "yes, put me on the waitlist if it's full". */
export const registerSchema = z
  .object({
    waitlist: z.boolean().default(false),
    code: z.string().trim().max(20).optional(),
  })
  .strict();

/** Bodies that must be empty JSON objects ({}). */
export const emptySchema = z.object({}).strict();
