/** A fresh in-memory D1 database (wrangler's getPlatformProxy) with every migration applied. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getPlatformProxy } from "wrangler";

export async function testDatabase() {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ configPath: path.resolve(__dirname, "../../wrangler.jsonc"), persist: false });
  const db = proxy.env.DB;
  const dir = path.resolve(__dirname, "../../migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const statements = readFileSync(path.join(dir, file), "utf8")
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
  return { db, dispose: () => proxy.dispose() };
}
