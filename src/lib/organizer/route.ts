import "server-only";
import { handle, ApiError, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { OrganizerError } from "@/lib/data/organizer-events";

/** Like handle(), but also sends an OrganizerError's extra fields, e.g. { missing: [...] }. */
export function orgHandle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return handle(async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof OrganizerError) return Response.json({ error: { code: e.code, message: e.message }, ...e.extra }, { status: e.status });
      throw e;
    }
  });
}

export type RefCtx = { params: Promise<{ ref: string }> };

/** Resolve :ref (id or slug) and check the caller owns it. */
export async function ownedEvent(ctx: RefCtx) {
  const { ref } = await ctx.params;
  const row = await first<{ id: string }>("SELECT id FROM events WHERE id = ? OR slug = ?", ref, ref);
  if (!row) throw new ApiError(404, "not_found", "Event not found.");
  const viewer = await requireEventOwner(row.id);
  return { id: row.id, viewer, db: await getDB() };
}

export { parseBody };
