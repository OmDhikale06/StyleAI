import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";
if (isProd && !process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set in production.");

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  // One or more allowed frontend origins, comma separated, without trailing slashes
  frontendOrigins: (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ai_fashion_db",
    port: Number(process.env.DB_PORT) || 3306,
    // Most hosted MySQL providers require TLS: set DB_SSL=true
    ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
  },
};
