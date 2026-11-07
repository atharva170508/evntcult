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

/** POST /api/checkins — one scan from a gate scanner (live or synced from the offline queue). */
export const checkinSchema = z
  .object({
    event_id: z.string().trim().min(1).max(64),
    pass_token: z.string().trim().min(1).max(200),
    /** The scanner's own id for this scan (UUID). Makes retries safe. */
    client_scan_id: z.string().trim().min(8).max(64),
    /** The volunteer collected the fee for an unpaid pass and tapped "Admit". */
    accept_unpaid: z.boolean().default(false),
    /** When the scan happened, for scans synced after the network came back. */
    scanned_at: z.string().datetime().optional(),
    device_id: z.string().trim().max(64).optional(),
  })
  .strict();

/** POST /api/registrations/:id/payment — organizer reconciles a fee. */
export const paymentSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("paid"),
      method: z.enum(["cash", "upi"]),
      /** UPI transaction reference (UTR), usually 12 digits. Optional. */
      ref: z.string().trim().regex(/^[A-Za-z0-9]{6,35}$/, "UPI reference: 6–35 letters or digits").optional(),
    })
    .strict(),
  z.object({ status: z.literal("unpaid") }).strict(),
]);

/** POST /api/events/:id/updates — schedule / venue / info update, optionally sent on WhatsApp. */
export const eventUpdateSchema = z
  .object({
    kind: z.enum(["schedule", "venue", "update"]),
    body: z.string().trim().min(3).max(500),
    whatsapp: z.boolean().default(false),
  })
  .strict();

/** "No limit" on the Host modal is stored as this many seats, so the seat counting stays the same. */
export const UNLIMITED_CAPACITY = 100_000;

/** UPI IDs look like name@bank (handle: letters, digits, dot, dash, underscore). */
const upiId = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/, "Enter a UPI ID like name@bank.");

const httpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500)
    .url(`Enter a full ${label} link starting with https://`)
    .refine((u) => u.startsWith("https://"), `The ${label} link must start with https://`);

/** POST /api/events/create — the one-screen "Host an Event" modal. Times are IST. */
export const hostEventSchema = z
  .object({
    title: z.string().trim().min(3, "Give your event a name (at least 3 characters).").max(120),
    tagline: z.string().trim().max(140).optional(),
    category: z.enum(CATEGORIES),
    date: ymd,
    time: hm,
    /** How long it runs; ends the same night or after midnight. */
    durationMinutes: z.number().int().min(15).max(24 * 60).default(120),
    eventType: z.enum(["in_person", "virtual"]),
    /** Venue name for in-person, meeting link for virtual. */
    location: z.string().trim().min(2, "Add where it happens.").max(500),
    isFree: z.boolean().default(true),
    /** Rupees, only when paid. */
    ticketPrice: z.number().min(1).max(10_000).optional(),
    upiId: upiId.optional(),
    /** Empty = no limit. */
    capacity: z.number().int().min(1).max(UNLIMITED_CAPACITY).nullable().default(null),
    driveFolderUrl: z.string().trim().max(500).optional(),
    bannerUrl: httpsUrl("image").optional(),
    acknowledgeSoftClashes: z.boolean().default(false),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.eventType === "virtual") {
      const ok = httpsUrl("meeting").safeParse(v.location);
      if (!ok.success) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["location"], message: "Paste the meeting link (https://…) for a virtual event." });
    } else if (v.location.length > 120) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["location"], message: "Keep the venue name under 120 characters." });
    }
    if (!v.isFree) {
      if (!v.ticketPrice) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ticketPrice"], message: "Set a ticket price for a paid pass." });
      if (!v.upiId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["upiId"], message: "Add the UPI ID where attendees pay you." });
    }
  });
export type HostEventInput = z.infer<typeof hostEventSchema>;
