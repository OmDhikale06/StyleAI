import { pool } from "../db/pool.js";
import { runRecommendation, runStylist, runCompleteLook } from "../services/stylist.js";

async function loadProducts() {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category,
      (SELECT image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.display_order LIMIT 1) AS image
     FROM products p JOIN categories c ON c.id = p.category_id WHERE p.stock > 0`);
  return rows;
}

// Attach in-stock colors/sizes so the UI can add the whole look to the cart
async function attachVariants(outfit) {
  if (!outfit?.items?.length) return outfit;
  const ids = outfit.items.map((i) => i.product.id);
  const [rows] = await pool.query(
    `SELECT product_id, color, size, image_url FROM product_variants WHERE stock > 0 AND product_id IN (${ids.map(() => "?").join(",")})`, ids);
  const by = new Map();
  for (const r of rows) {
    const m = by.get(r.product_id) || new Map();
    if (!m.has(r.color)) m.set(r.color, { color: r.color, image_url: r.image_url, sizes: [] });
    m.get(r.color).sizes.push(r.size);
    by.set(r.product_id, m);
  }
  for (const item of outfit.items) item.product.colors = [...(by.get(item.product.id)?.values() || [])];
  return outfit;
}

async function respond(res, result) {
  if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.error });
  if (result.outfit) await attachVariants(result.outfit);
  const { status, ...body } = result;
  res.json({ success: true, ...body });
}

export const recommend = async (req, res) => respond(res, runRecommendation(await loadProducts(), req.body || {}));
export const stylist = async (req, res) => respond(res, runStylist(await loadProducts(), req.body || {}));
export const completeLook = async (req, res) => respond(res, runCompleteLook(await loadProducts(), req.body || {}));
