import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = await readFile(sqlPath, "utf-8");
  await pool.query(sql);
  await pool.end();
}

migrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
