import { z } from "zod";
import { CATEGORIES } from "@/lib/data/types";
import { UPI_PATTERN, isValidCustomCode, isValidLink, LINK_ERROR } from "@/lib/organizer/shared";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

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
  z.object({ status: z.literal("rejected") }).strict(),
]);

/** POST /api/registrations/:id/upi — the student hands in their UPI transaction ID. */
export const upiClaimSchema = z
  .object({
    utr: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .pipe(z.string().regex(/^\d{12}$/, "Enter the 12-digit transaction ID.")),
  })
  .strict();

/** POST /api/events/:id/updates — schedule / venue / info update, optionally sent on WhatsApp. */
export const eventUpdateSchema = z
  .object({
    kind: z.enum(["schedule", "venue", "update"]),
    body: z.string().trim().min(3).max(500),
    whatsapp: z.boolean().default(false),
  })
  .strict();

const upi = z.string().trim().toLowerCase().regex(UPI_PATTERN, "Enter a UPI ID like name@bank.");

/** Everything the organizer editor can send. All optional: anything left out keeps its value. */
const eventFields = {
  title: z.string().trim().min(1, "Give your event a name.").max(60),
  slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens.").optional(),
  tagline: z.string().trim().max(140).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  category: z.enum(CATEGORIES).nullable().optional(),
  venue: z.string().trim().max(160).nullable().optional(),
  venueStatus: z.enum(["confirmed", "tba", "online"]).optional(),
  date: ymd.optional(),
  time: hm.optional(),
  durationMinutes: z.number().int().min(15).max(14 * 24 * 60).optional(),
  capacity: z.number().int().min(1).max(1_000_000).nullable().optional(),
  pricePaise: z.number().int().min(0).max(10_000_000).optional(),
  payoutUpi: upi.nullable().optional(),
  access: z.enum(["public", "code"]).optional(),
  venuePlaceId: z.string().trim().regex(/^[\w-]{1,300}$/).nullable().optional(),
  venueLat: z.number().min(-90).max(90).nullable().optional(),
  venueLng: z.number().min(-180).max(180).nullable().optional(),
  venueAddress: z.string().trim().max(300).nullable().optional(),
  linkUrl: z.string().trim().refine(isValidLink, LINK_ERROR).nullable().optional(),
  accessCode: z
    .string()
    .trim()
    .refine(isValidCustomCode, "Use 4 to 20 letters or numbers.")
    .nullable()
    .optional(),
};

/** POST /api/events: the first save of a new event. */
export const createDraftSchema = z.object(eventFields).strict();

/** PATCH /api/events/:id: autosave. `version` is what the client last saw. */
export const saveEventSchema = z
  .object({ ...eventFields, title: eventFields.title.optional(), version: z.number().int().min(1) })
  .strict();

export const versionSchema = z.object({ version: z.number().int().min(1), acknowledgeSoftClashes: z.boolean().optional() }).strict();

/** GET /api/events?from&to: the organizer's calendar window. */
export const windowQuerySchema = z.object({ from: z.string().datetime(), to: z.string().datetime() });
