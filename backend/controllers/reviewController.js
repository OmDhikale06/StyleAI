import { pool } from "../db/pool.js";
import { HttpError } from "../utils/asyncHandler.js";
import { toInt } from "../utils/validate.js";

export async function listReviews(req, res) {
  const productId = toInt(req.params.productId, "product");
  const [reviews] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [productId]);
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => dist[r.rating]++);
  res.json({ success: true, reviews, distribution: dist, total: reviews.length });
}

export async function createReview(req, res) {
  const productId = toInt(req.body?.productId, "product");
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Please choose a rating from 1 to 5.");
  if (comment.length < 5 || comment.length > 1000) throw new HttpError(400, "Please write a review of 5–1000 characters.");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[p]] = await conn.query("SELECT rating, review_count FROM products WHERE id = ? FOR UPDATE", [productId]);
    if (!p) throw new HttpError(404, "Product not found.");
    try {
      await conn.query("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)", [productId, req.user.id, rating, comment]);
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") throw new HttpError(409, "You have already reviewed this product.");
      throw e;
    }
    // Fold the new rating into the running average
    const count = p.review_count + 1;
    const avg = Math.round(((Number(p.rating) * p.review_count + rating) / count) * 10) / 10;
    await conn.query("UPDATE products SET rating = ?, review_count = ? WHERE id = ?", [avg, count, productId]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.status(201).json({ success: true, message: "Thanks for your review!" });
}
