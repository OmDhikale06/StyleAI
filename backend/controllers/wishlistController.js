import { pool } from "../db/pool.js";
import { HttpError } from "../utils/asyncHandler.js";
import { toInt, parseCartItem } from "../utils/validate.js";

async function list(userId) {
  const [rows] = await pool.query(
    `SELECT w.id AS wishlist_id, p.id AS product_id, p.name, p.brand, p.price, p.original_price, p.discount, p.rating,
            p.review_count, p.stock, c.name AS category,
            (SELECT image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.display_order LIMIT 1) AS image
     FROM wishlist w JOIN products p ON p.id = w.product_id JOIN categories c ON c.id = p.category_id
     WHERE w.user_id = ? ORDER BY w.id DESC`, [userId]);
  return rows.map((r) => ({ ...r, price: Number(r.price), original_price: Number(r.original_price) }));
}

export async function getWishlist(req, res) {
  res.json({ success: true, items: await list(req.user.id) });
}

export async function addToWishlist(req, res) {
  const productId = toInt(req.body?.productId, "product");
  try {
    await pool.query("INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)", [req.user.id, productId]);
  } catch (e) {
    if (e.code === "ER_NO_REFERENCED_ROW_2") throw new HttpError(404, "Product not found.");
    throw e;
  }
  res.status(201).json({ success: true, message: "Added to wishlist.", items: await list(req.user.id) });
}

export async function removeFromWishlist(req, res) {
  const [r] = await pool.query("DELETE FROM wishlist WHERE id = ? AND user_id = ?", [toInt(req.params.wishlistId, "wishlist item"), req.user.id]);
  if (!r.affectedRows) throw new HttpError(404, "Wishlist item not found.");
  res.json({ success: true, message: "Removed from wishlist.", items: await list(req.user.id) });
}

// Move to cart needs a size and color, so the client sends them
export async function moveToCart(req, res) {
  const id = toInt(req.params.wishlistId, "wishlist item");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[w]] = await conn.query("SELECT product_id FROM wishlist WHERE id = ? AND user_id = ? FOR UPDATE", [id, req.user.id]);
    if (!w) throw new HttpError(404, "Wishlist item not found.");
    const it = parseCartItem({ ...req.body, productId: w.product_id });
    const [[v]] = await conn.query("SELECT stock FROM product_variants WHERE product_id = ? AND color = ? AND size = ?", [it.productId, it.color, it.size]);
    if (!v) throw new HttpError(400, "That size and color combination is not available.");
    if (v.stock < it.quantity) throw new HttpError(409, "Sorry, that size and color is out of stock.");
    await conn.query(
      `INSERT INTO cart (user_id, product_id, quantity, selected_size, selected_color) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)`,
      [req.user.id, it.productId, it.quantity, it.size, it.color, Math.min(v.stock, 10)]);
    await conn.query("DELETE FROM wishlist WHERE id = ?", [id]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json({ success: true, message: "Moved to cart.", items: await list(req.user.id) });
}
