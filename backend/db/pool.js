import mysql from "mysql2/promise";
import { config } from "../utils/config.js";

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function checkConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}
