import "server-only";
import { ApiError } from "@/lib/api";
import { getDB } from "@/lib/db";
import { ActionError } from "./organizer-actions";

/** Run an organizer-actions call with the request's D1 and turn its errors into API errors. */
export async function withOrganizerActions<T>(fn: (db: D1Database) => Promise<T>): Promise<T> {
  try {
    return await fn(await getDB());
  } catch (err) {
    if (err instanceof ActionError) throw new ApiError(err.status, err.code, err.message);
    throw err;
  }
}
