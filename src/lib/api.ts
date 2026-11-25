import "server-only";
import { z } from "zod";

const DEFAULT_MAX_BODY_BYTES = 256 * 1024; // 256 KB cap against payload DoS

/** Every API error has the shape { error: { code, message } }. Never a stack trace. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorJson = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });

/** Wrap a route handler: turns ApiError into JSON and hides unexpected errors. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return errorJson(err.status, err.code, err.message);
      console.error(err);
      return errorJson(500, "internal", "Something went wrong. Please try again.");
    }
  };
}

/** Parse a JSON body with a strict schema and payload size cap (unknown fields are rejected). */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
  opts?: { maxBytes?: number },
): Promise<z.infer<T>> {
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
  const contentLen = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLen) && contentLen > maxBytes) {
    throw new ApiError(413, "payload_too_large", "Request body is too large.");
  }

  let text: string;
  try {
    text = await req.text();
  } catch {
    throw new ApiError(400, "bad_json", "The request body must be JSON.");
  }
  if (text.length > maxBytes) {
    throw new ApiError(413, "payload_too_large", "Request body is too large.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ApiError(400, "bad_json", "The request body must be JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, "invalid", issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request.");
  }
  return parsed.data;
}
