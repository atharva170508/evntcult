import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The D1 database binding (local simulation under `next dev`, real D1 in production). */
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;
  if (!schemaReady) {
    schemaReady = ensureSchema(db).catch((err) => {
      console.error("ensureSchema failed", err);
      schemaReady = null; // try again on the next request
    });
  }
  await schemaReady;
  return db;
}

/**
 * Safety net for migrations that were merged but not applied to the live database
 * (the deploy token cannot run `wrangler d1 migrations apply`). Adds any missing
 * columns from 0020 and 0021 once per worker, then records both migrations in
 * d1_migrations so wrangler skips them later. Every step is idempotent.
 */
let schemaReady: Promise<void> | null = null;

const USER_COLUMNS: [string, string, string][] = [
  ["0020_host_applications.sql", "host_status", "TEXT NOT NULL DEFAULT 'none'"],
  ["0020_host_applications.sql", "host_club", "TEXT"],
  ["0020_host_applications.sql", "host_note", "TEXT"],
  ["0020_host_applications.sql", "host_applied_at", "TEXT"],
  ["0020_host_applications.sql", "host_decided_at", "TEXT"],
  ["0021_terms_acceptance.sql", "terms_accepted_at", "TEXT"],
  ["0021_terms_acceptance.sql", "terms_version", "TEXT"],
];

async function ensureSchema(db: D1Database): Promise<void> {
  // 0022: "Interested" saves. Idempotent, so it is safe on every cold start.
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS event_saves (
         user_id TEXT NOT NULL REFERENCES users(id),
         event_id TEXT NOT NULL REFERENCES events(id),
         created_at TEXT NOT NULL,
         PRIMARY KEY (user_id, event_id))`,
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_event_saves_event ON event_saves(event_id)"),
    // 0023: volunteer gate links.
    db.prepare(
      `CREATE TABLE IF NOT EXISTS volunteer_links (
         id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), token_hash TEXT NOT NULL UNIQUE,
         label TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'gate', created_by TEXT NOT NULL REFERENCES users(id),
         created_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT, last_used_at TEXT,
         scans INTEGER NOT NULL DEFAULT 0)`,
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_volunteer_links_event ON volunteer_links(event_id)"),
  ]);

  // 0024: category setup JSON on events.
  const evCols = await db.prepare("PRAGMA table_info(events)").all<{ name: string }>();
  if (!(evCols.results ?? []).some((c) => c.name === "category_config")) {
    await db.prepare("ALTER TABLE events ADD COLUMN category_config TEXT").run();
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0024_category_config.sql", "0024_category_config.sql").run();
    } catch {
      // no d1_migrations table locally
    }
  }

  const info = await db.prepare("PRAGMA table_info(users)").all<{ name: string }>();
  const have = new Set((info.results ?? []).map((c) => c.name));
  const missing = USER_COLUMNS.filter(([, col]) => !have.has(col));
  if (missing.length === 0) return;

  const stmts = missing.map(([, col, def]) => db.prepare(`ALTER TABLE users ADD COLUMN ${col} ${def}`));
  if (missing.some(([, col]) => col === "host_status")) {
    // Everyone who already hosts keeps hosting.
    stmts.push(db.prepare("UPDATE users SET host_status = 'approved' WHERE role IN ('organizer', 'admin')"));
    stmts.push(
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_users_host_pending ON users(host_applied_at) WHERE host_status = 'pending'",
      ),
    );
  }
  await db.batch(stmts);

  for (const name of new Set(missing.map(([file]) => file))) {
    try {
      await db
        .prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)")
        .bind(name, name)
        .run();
    } catch {
      // No d1_migrations table (e.g. a fresh local database): nothing to record.
    }
  }
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
