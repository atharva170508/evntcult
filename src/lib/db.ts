import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The D1 database binding (local simulation under `next dev`, real D1 in production). */
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

/** Run a SELECT and return all rows. Always use `?` placeholders — never string-build SQL. */
export async function all<T>(sql: string, ...params: unknown[]): Promise<T[]> {
  const db = await getDB();
  const res = await db.prepare(sql).bind(...params).all<T>();
  return res.results ?? [];
}

/** Run a SELECT and return the first row, or null. */
export async function first<T>(sql: string, ...params: unknown[]): Promise<T | null> {
  const db = await getDB();
  return (await db.prepare(sql).bind(...params).first<T>()) ?? null;
}

/** Run an INSERT / UPDATE / DELETE and return how many rows changed. */
export async function run(sql: string, ...params: unknown[]): Promise<number> {
  const db = await getDB();
  const res = await db.prepare(sql).bind(...params).run();
  return res.meta.changes ?? 0;
}

/** SELECT COUNT(*) helper. */
export async function count(sql: string, ...params: unknown[]): Promise<number> {
  const row = await first<{ n: number }>(sql, ...params);
  return row?.n ?? 0;
}

/** True when the error is a SQLite UNIQUE / PRIMARY KEY constraint violation. */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(err.message);
}
