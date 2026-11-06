// Applies hand-written SQL in prisma/sql/*.sql (constraints Prisma can't model).
// Every file is idempotent, so this is safe to re-run on each deploy.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dir = join(process.cwd(), "prisma", "sql");

try {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(dir, file), "utf8")
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log(`applied ${file}`);
  }
} finally {
  await prisma.$disconnect();
}
