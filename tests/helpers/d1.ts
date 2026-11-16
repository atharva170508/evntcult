/** A fresh in-memory D1 database (wrangler's getPlatformProxy) with migrations applied, plus a local R2 bucket. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getPlatformProxy } from "wrangler";

const DIR = path.resolve(__dirname, "../../migrations");

/** Run migration files in order, optionally only from one prefix or up to one prefix (inclusive). */
export async function applyMigrations(db: D1Database, opts: { from?: string; until?: string } = {}) {
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => (!opts.from || f.slice(0, 4) >= opts.from) && (!opts.until || f.slice(0, 4) <= opts.until));
  for (const file of files) {
    const statements = readFileSync(path.join(DIR, file), "utf8")
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
}

export async function testDatabase(opts: { until?: string } = {}) {
  const proxy = await getPlatformProxy<{ DB: D1Database; PHOTOS: R2Bucket }>({ configPath: path.resolve(__dirname, "../wrangler.test.jsonc"), persist: false });
  const db = proxy.env.DB;
  await applyMigrations(db, { until: opts.until });
  return { db, photos: proxy.env.PHOTOS, dispose: () => proxy.dispose() };
}
