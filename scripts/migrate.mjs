import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({ url, authToken });

const migrationsDir = path.join(import.meta.dirname, "..", "prisma", "migrations");

await client.execute(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY,
    "migration_name" TEXT NOT NULL UNIQUE,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" DATETIME
  )
`);

const applied = await client.execute(`SELECT migration_name FROM "_prisma_migrations"`);
const appliedSet = new Set(applied.rows.map((r) => r.migration_name));

const entries = await readdir(migrationsDir, { withFileTypes: true });
const migrationDirs = entries
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

for (const dir of migrationDirs) {
  if (appliedSet.has(dir)) {
    console.log(`Skipping ${dir} (already applied)`);
    continue;
  }

  const sqlPath = path.join(migrationsDir, dir, "migration.sql");
  let sql;
  try {
    sql = await readFile(sqlPath, "utf-8");
  } catch {
    console.log(`Skipping ${dir} (no migration.sql)`);
    continue;
  }

  console.log(`Applying ${dir}...`);

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  await client.execute({
    sql: `INSERT INTO "_prisma_migrations" ("id", "migration_name", "finished_at") VALUES (?, ?, datetime('now'))`,
    args: [crypto.randomUUID(), dir],
  });

  console.log(`Applied ${dir}`);
}

console.log("Migrations complete.");
client.close();
