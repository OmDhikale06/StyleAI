import { calculateTotals } from "./pricing.js";
import { HttpError } from "../utils/asyncHandler.js";
import { randomUUID } from "node:crypto";

// Places an order inside one transaction: lock stock -> create order -> items -> decrement stock -> clear cart.
// Prices and quantities come from the database cart, never from the request.
export async function placeOrder(pool, userId, shipping, paymentMethod) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [lines] = await conn.query(
      `SELECT c.id AS cart_id, c.quantity, c.selected_size, c.selected_color, p.id AS product_id, p.name, p.price, p.original_price,
              v.id AS variant_id, v.stock AS variant_stock
       FROM cart c JOIN products p ON p.id = c.product_id
       LEFT JOIN product_variants v ON v.product_id = c.product_id AND v.color = c.selected_color AND v.size = c.selected_size
       WHERE c.user_id = ? ORDER BY c.id FOR UPDATE`, [userId]);
    if (!lines.length) throw new HttpError(400, "Your cart is empty.");
    for (const l of lines) {
      if (l.variant_id === null || l.variant_stock < l.quantity) {
        throw new HttpError(409, `"${l.name}" (${l.selected_color}, ${l.selected_size}) is no longer available in the requested quantity.`);
      }
    }

    const t = calculateTotals(lines);
    const [ins] = await conn.query(
      `INSERT INTO orders (order_code, user_id, subtotal, discount, delivery_fee, total, status, payment_method,
                           full_name, email, phone, address, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, 'Placed', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`TMP-${randomUUID().slice(0, 15)}`, userId, t.subtotal, t.discount, t.delivery, t.total, paymentMethod,
       shipping.fullName, shipping.email, shipping.phone, shipping.address, shipping.city, shipping.state, shipping.pincode]);
    const orderId = ins.insertId;
    const orderCode = `#STY${String(orderId).padStart(5, "0")}`;
    await conn.query("UPDATE orders SET order_code = ? WHERE id = ?", [orderCode, orderId]);

    for (const l of lines) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, selected_size, selected_color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, l.product_id, l.name, l.price, l.quantity, l.selected_size, l.selected_color]);
      await conn.query("UPDATE product_variants SET stock = stock - ? WHERE id = ?", [l.quantity, l.variant_id]);
      await conn.query("UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?", [l.quantity, l.product_id]);
    }
    await conn.query("DELETE FROM cart WHERE user_id = ?", [userId]);

    await conn.commit();
    return { orderId, orderCode, totals: t, estimatedDelivery: "3–5 Days" };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
