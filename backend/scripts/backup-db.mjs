import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL env var.");
  process.exit(1);
}

const backupDir = resolve(process.env.BACKUP_DIR ?? "backups");
mkdirSync(backupDir, { recursive: true });

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const outputFile = resolve(backupDir, `hardware_store_${stamp}.dump`);

const result = spawnSync("pg_dump", ["--format=custom", "--file", outputFile, databaseUrl], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error("Database backup failed.");
  process.exit(result.status ?? 1);
}

console.log(`Backup created at: ${outputFile}`);

