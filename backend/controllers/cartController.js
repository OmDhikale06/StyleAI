import { pool } from "../db/pool.js";
import { calculateTotals } from "../services/pricing.js";
import { HttpError } from "../utils/asyncHandler.js";
import { parseCartItem, toInt, MAX_QTY } from "../utils/validate.js";

export async function buildCart(userId, db = pool) {
  const [rows] = await db.query(
    `SELECT c.id AS cart_id, c.quantity, c.selected_size, c.selected_color, p.id AS product_id, p.name, p.brand,
            p.price, p.original_price, p.discount, v.stock AS variant_stock,
            COALESCE(v.image_url, (SELECT image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.display_order LIMIT 1)) AS image
     FROM cart c JOIN products p ON p.id = c.product_id
     LEFT JOIN product_variants v ON v.product_id = c.product_id AND v.color = c.selected_color AND v.size = c.selected_size
     WHERE c.user_id = ? ORDER BY c.id DESC`, [userId]);
  const items = rows.map((r) => ({ ...r, price: Number(r.price), original_price: Number(r.original_price), subtotal: Number(r.price) * r.quantity }));
  return { items, summary: calculateTotals(items) };
}

export async function getCart(req, res) {
  res.json({ success: true, ...(await buildCart(req.user.id)) });
}

async function addItems(userId, items) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const it of items) {
      const [[variant]] = await conn.query(
        "SELECT stock FROM product_variants WHERE product_id = ? AND color = ? AND size = ? FOR UPDATE", [it.productId, it.color, it.size]);
      if (!variant) throw new HttpError(400, "That size and color combination is not available.");
      if (variant.stock < 1) throw new HttpError(409, "Sorry, that size and color is out of stock.");
      const [[existing]] = await conn.query(
        "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND selected_size = ? AND selected_color = ? FOR UPDATE",
        [userId, it.productId, it.size, it.color]);
      const newQty = (existing?.quantity || 0) + it.quantity;
      const cap = Math.min(variant.stock, MAX_QTY);
      if (newQty > cap) throw new HttpError(409, `Only ${cap} available for that size and color.`);
      if (existing) await conn.query("UPDATE cart SET quantity = ? WHERE id = ?", [newQty, existing.id]);
      else await conn.query(
        "INSERT INTO cart (user_id, product_id, quantity, selected_size, selected_color) VALUES (?, ?, ?, ?, ?)",
        [userId, it.productId, it.quantity, it.size, it.color]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_NO_REFERENCED_ROW_2") throw new HttpError(404, "Product not found.");
    throw e;
  } finally {
    conn.release();
  }
}

export async function addToCart(req, res) {
  await addItems(req.user.id, [parseCartItem(req.body)]);
  res.status(201).json({ success: true, message: "Product added to cart.", ...(await buildCart(req.user.id)) });
}

export async function addBulk(req, res) {
  const list = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!list.length || list.length > 10) throw new HttpError(400, "Provide between 1 and 10 items.");
  await addItems(req.user.id, list.map(parseCartItem));
  res.status(201).json({ success: true, message: "Complete look added to cart.", ...(await buildCart(req.user.id)) });
}

export async function updateCartItem(req, res) {
  const id = toInt(req.params.cartId, "cart item");
  const quantity = toInt(req.body?.quantity, "quantity");
  const [[row]] = await pool.query(
    `SELECT c.id, v.stock FROM cart c LEFT JOIN product_variants v
     ON v.product_id = c.product_id AND v.color = c.selected_color AND v.size = c.selected_size
     WHERE c.id = ? AND c.user_id = ?`, [id, req.user.id]);
  if (!row) throw new HttpError(404, "Cart item not found.");
  const cap = Math.min(row.stock ?? 0, MAX_QTY);
  if (quantity > cap) throw new HttpError(409, cap ? `Only ${cap} available for that size and color.` : "That item is no longer available.");
  await pool.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, id]);
  res.json({ success: true, ...(await buildCart(req.user.id)) });
}

export async function removeCartItem(req, res) {
  const [r] = await pool.query("DELETE FROM cart WHERE id = ? AND user_id = ?", [toInt(req.params.cartId, "cart item"), req.user.id]);
  if (!r.affectedRows) throw new HttpError(404, "Cart item not found.");
  res.json({ success: true, message: "Item removed.", ...(await buildCart(req.user.id)) });
}

export async function clearCart(req, res) {
  await pool.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
  res.json({ success: true, message: "Cart cleared.", ...(await buildCart(req.user.id)) });
}

export async function cartItemToWishlist(req, res) {
  const id = toInt(req.params.cartId, "cart item");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[row]] = await conn.query("SELECT product_id FROM cart WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (!row) throw new HttpError(404, "Cart item not found.");
    await conn.query("INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)", [req.user.id, row.product_id]);
    await conn.query("DELETE FROM cart WHERE id = ?", [id]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json({ success: true, message: "Moved to wishlist.", ...(await buildCart(req.user.id)) });
}
