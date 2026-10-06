// Creates the schema and loads seed data. Works for local MySQL and hosted databases.
//   npm run db:setup              -> schema + seed
//   npm run db:setup -- --dry-run -> parse the SQL files only (no connection)
// WARNING: schema.sql drops and recreates every StyleAI table.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../database");
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");
// The database is chosen by DB_NAME, so drop the CREATE DATABASE / USE lines (hosted users often cannot run them)
const clean = (sql) => sql.replace(/^\s*CREATE DATABASE[^;]*;/gim, "").replace(/^\s*USE\s+[^;]*;/gim, "");

const schema = clean(read("schema.sql"));
const seed = read("seed.sql");

if (process.argv.includes("--dry-run")) {
  console.log("schema tables:", (schema.match(/CREATE TABLE/g) || []).length);
  console.log("seed inserts :", (seed.match(/INSERT INTO/g) || []).length);
  console.log("create-db/use stripped:", !/CREATE DATABASE|^\s*USE /im.test(schema));
  process.exit(0);
}

const mysql = (await import("mysql2/promise")).default;
const { config } = await import("../utils/config.js");
const { database, ...server } = config.db;
const local = ["localhost", "127.0.0.1"].includes(server.host);

try {
  let conn = await mysql.createConnection({ ...server, multipleStatements: true });
  if (local) await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.changeUser({ database });
  console.log(`Connected to ${server.host}/${database}. Creating tables…`);
  await conn.query(schema);
  console.log("Loading seed data…");
  await conn.query(seed);
  const [[p]] = await conn.query("SELECT COUNT(*) AS n FROM products");
  const [[v]] = await conn.query("SELECT COUNT(*) AS n FROM product_variants");
  console.log(`Done: ${p.n} products, ${v.n} variants.`);
  await conn.end();
} catch (e) {
  console.error("Database setup failed:", e.message);
  process.exit(1);
}
