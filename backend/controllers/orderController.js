import { pool } from "../db/pool.js";
import { placeOrder } from "../services/orderService.js";
import { HttpError } from "../utils/asyncHandler.js";
import { parseShipping, parsePayment, toInt } from "../utils/validate.js";

export async function createOrder(req, res) {
  const shipping = parseShipping(req.body?.shipping || req.body);
  const payment = parsePayment(req.body?.paymentMethod);
  const result = await placeOrder(pool, req.user.id, shipping, payment);
  res.status(201).json({ success: true, message: "Order placed successfully.", order: result });
}

export async function listOrders(req, res) {
  const [orders] = await pool.query(
    `SELECT o.id, o.order_code, o.total, o.status, o.payment_method, o.created_at,
            (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o WHERE o.user_id = ? ORDER BY o.id DESC`, [req.user.id]);
  res.json({ success: true, orders: orders.map((o) => ({ ...o, total: Number(o.total), item_count: Number(o.item_count) })) });
}

export async function getOrder(req, res) {
  const orderId = toInt(req.params.orderId, "order");
  const [[order]] = await pool.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, req.user.id]);
  if (!order) throw new HttpError(404, "Order not found.");
  const [items] = await pool.query(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.unit_price, oi.quantity, oi.selected_size, oi.selected_color,
            (SELECT image_url FROM product_images i WHERE i.product_id = oi.product_id ORDER BY i.display_order LIMIT 1) AS image
     FROM order_items oi WHERE oi.order_id = ?`, [orderId]);
  res.json({
    success: true,
    order: { ...order, subtotal: Number(order.subtotal), discount: Number(order.discount), delivery_fee: Number(order.delivery_fee), total: Number(order.total),
             items: items.map((i) => ({ ...i, unit_price: Number(i.unit_price), subtotal: Number(i.unit_price) * i.quantity })) },
  });
}
