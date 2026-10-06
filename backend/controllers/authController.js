import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { config } from "../utils/config.js";
import { HttpError } from "../utils/asyncHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (u) => jwt.sign({ id: u.id, name: u.name, email: u.email }, config.jwtSecret, { expiresIn: "7d" });

export async function signup(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const confirm = req.body.confirmPassword;

  if (name.length < 2 || name.length > 100) throw new HttpError(400, "Please enter your full name.");
  if (!EMAIL_RE.test(email) || email.length > 150) throw new HttpError(400, "Please enter a valid email.");
  if (password.length < 6 || password.length > 72) throw new HttpError(400, "Password must be 6–72 characters.");
  if (confirm !== undefined && confirm !== password) throw new HttpError(400, "Passwords do not match.");

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length) throw new HttpError(409, "An account with this email already exists.");

  const hash = await bcrypt.hash(password, 10);
  let result;
  try {
    [result] = await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hash]);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new HttpError(409, "An account with this email already exists.");
    throw e;
  }
  const user = { id: result.insertId, name, email };
  res.status(201).json({ success: true, message: "Account created.", user, token: sign(user) });
}

export async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) throw new HttpError(400, "Email and password are required.");

  const [rows] = await pool.query("SELECT id, name, email, password FROM users WHERE email = ?", [email]);
  let ok = false;
  if (rows.length) {
    try { ok = await bcrypt.compare(password, rows[0].password); } catch { ok = false; }
  }
  if (!ok) throw new HttpError(401, "Invalid email or password.");

  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email };
  res.json({ success: true, message: "Logged in.", user, token: sign(user) });
}
