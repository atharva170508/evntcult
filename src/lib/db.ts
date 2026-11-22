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
    // 0028: teams.
    db.prepare(
      `CREATE TABLE IF NOT EXISTS teams (
         id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), name TEXT NOT NULL,
         join_code TEXT NOT NULL, captain_id TEXT NOT NULL, created_at TEXT NOT NULL)`,
    ),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_code ON teams(event_id, join_code)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name ON teams(event_id, lower(name))"),
    // 0029: guest wall.
    db.prepare(
      `CREATE TABLE IF NOT EXISTS event_posts (
         id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), user_id TEXT NOT NULL REFERENCES users(id),
         body TEXT NOT NULL, created_at TEXT NOT NULL)`,
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_event_posts_event ON event_posts(event_id, created_at)"),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS event_post_reactions (
         post_id TEXT NOT NULL REFERENCES event_posts(id), user_id TEXT NOT NULL REFERENCES users(id), emoji TEXT NOT NULL,
         PRIMARY KEY (post_id, user_id, emoji))`,
    ),
    // 0030: follows and reports.
    db.prepare(
      `CREATE TABLE IF NOT EXISTS host_follows (
         user_id TEXT NOT NULL REFERENCES users(id), host_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
         PRIMARY KEY (user_id, host_id))`,
    ),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_host_follows_host ON host_follows(host_id)"),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS event_reports (
         id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), user_id TEXT REFERENCES users(id),
         reason TEXT NOT NULL, details TEXT, created_at TEXT NOT NULL)`,
    ),
    // 0032: page views.
    db.prepare(
      `CREATE TABLE IF NOT EXISTS event_views (
         event_id TEXT NOT NULL REFERENCES events(id), day TEXT NOT NULL, source TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0,
         PRIMARY KEY (event_id, day, source))`,
    ),
    // 0027: event posters.
    db.prepare(
      `CREATE TABLE IF NOT EXISTS event_posters (
         event_id TEXT PRIMARY KEY REFERENCES events(id), mime TEXT NOT NULL, data BLOB NOT NULL, updated_at TEXT NOT NULL)`,
    ),
  ]);

  // 0024: category setup JSON on events.
  const evCols = await db.prepare("PRAGMA table_info(events)").all<{ name: string }>();
  // 0031: page look.
  if (!(evCols.results ?? []).some((c) => c.name === "look")) {
    await db.prepare("ALTER TABLE events ADD COLUMN look TEXT").run();
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0031_event_look.sql", "0031_event_look.sql").run();
    } catch {
      // no d1_migrations table locally
    }
  }
  // 0030: refund policy.
  if (!(evCols.results ?? []).some((c) => c.name === "refund_policy")) {
    await db.prepare("ALTER TABLE events ADD COLUMN refund_policy TEXT").run();
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0030_follow_refund_report.sql", "0030_follow_refund_report.sql").run();
    } catch {
      // no d1_migrations table locally
    }
  }
  // 0029: page effect.
  if (!(evCols.results ?? []).some((c) => c.name === "effect")) {
    await db.prepare("ALTER TABLE events ADD COLUMN effect TEXT").run();
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0029_wall_effects.sql", "0029_wall_effects.sql").run();
    } catch {
      // no d1_migrations table locally
    }
  }
  if (!(evCols.results ?? []).some((c) => c.name === "category_config")) {
    await db.prepare("ALTER TABLE events ADD COLUMN category_config TEXT").run();
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0024_category_config.sql", "0024_category_config.sql").run();
    } catch {
      // no d1_migrations table locally
    }
  }

  // 0025: sign-up rules (cutoff, host approval, agenda).
  const evHave = new Set((evCols.results ?? []).map((c) => c.name));
  const rules: [string, string][] = [
    ["reg_closes_at", "TEXT"],
    ["requires_approval", "INTEGER NOT NULL DEFAULT 0"],
    ["agenda", "TEXT"],
  ];
  const addRules = rules.filter(([c]) => !evHave.has(c));
  if (addRules.length) {
    await db.batch(addRules.map(([c, def]) => db.prepare(`ALTER TABLE events ADD COLUMN ${c} ${def}`)));
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0025_signup_rules.sql", "0025_signup_rules.sql").run();
    } catch {
      // no d1_migrations table locally
    }
  }

  // 0026: ticket types, promo codes, and per-guest amount.
  const regCols = await db.prepare("PRAGMA table_info(registrations)").all<{ name: string }>();
  const regHave = new Set((regCols.results ?? []).map((c) => c.name));
  const add26 = [
    ...(evHave.has("tiers") ? [] : ["ALTER TABLE events ADD COLUMN tiers TEXT"]),
    ...(evHave.has("promos") ? [] : ["ALTER TABLE events ADD COLUMN promos TEXT"]),
    ...(regHave.has("amount_paise") ? [] : ["ALTER TABLE registrations ADD COLUMN amount_paise INTEGER"]),
    ...(regHave.has("tier") ? [] : ["ALTER TABLE registrations ADD COLUMN tier TEXT"]),
    ...(regHave.has("promo_code") ? [] : ["ALTER TABLE registrations ADD COLUMN promo_code TEXT"]),
    ...(regHave.has("team_id") ? [] : ["ALTER TABLE registrations ADD COLUMN team_id TEXT"]),
  ];
  if (add26.length) {
    await db.batch(add26.map((q) => db.prepare(q)));
    try {
      await db.prepare("INSERT INTO d1_migrations (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name = ?)").bind("0026_tiers_promos.sql", "0026_tiers_promos.sql").run();
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
