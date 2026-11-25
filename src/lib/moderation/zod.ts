import type { z } from "zod";
import { blockedMessage, findBlocked } from "./index";

/**
 * A zod check for user-written text: `z.string().superRefine(moderated("Event name"))`.
 * Blocked text fails validation with a `contentBlocked` marker, which parseBody turns into a
 * 422 `content_blocked` error carrying the plain-English message (see src/lib/api.ts).
 */
export const moderated =
  (label: string) =>
  (value: string | null | undefined, ctx: z.RefinementCtx) => {
    if (findBlocked(value)) ctx.addIssue({ code: "custom", message: blockedMessage(label), params: { contentBlocked: true } });
  };
