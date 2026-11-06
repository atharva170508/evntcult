import "server-only";
import { ApiError } from "@/lib/api";
import { getDB } from "@/lib/db";
import { RegistrationError } from "./registrations";

/** Run a registrations.ts call with the request's D1 and turn its rule errors into API errors. */
export async function withRegistrations<T>(fn: (db: D1Database) => Promise<T>): Promise<T> {
  try {
    return await fn(await getDB());
  } catch (err) {
    if (err instanceof RegistrationError) throw new ApiError(err.status, err.code, err.message);
    throw err;
  }
}
