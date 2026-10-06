import { pool } from "../db/pool.js";
import { buildProductQuery } from "../services/productQuery.js";
import { HttpError } from "../utils/asyncHandler.js";

export async function listProducts(req, res) {
  const query = { ...req.query };
  if (req.params.keyword) query.q = req.params.keyword;
  const b = buildProductQuery(query);
  const [[{ total }]] = await pool.query(b.countSql, b.countParams);
  const [products] = await pool.query(b.listSql, b.listParams);
  res.json({
    success: true,
    products,
    pagination: { page: b.page, limit: b.limit, total, pages: Math.ceil(total / b.limit) },
  });
}

export async function getProduct(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid product id");

  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [id]);
  if (!rows.length) throw new HttpError(404, "Product not found");

  const [images] = await pool.query(
    "SELECT id, image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order", [id]);
  const [variants] = await pool.query(
    "SELECT id, color, size, stock, image_url FROM product_variants WHERE product_id = ? ORDER BY color, id", [id]);

  // Group variants by color so the UI can swap the image and list sizes per color
  const colorMap = new Map();
  for (const v of variants) {
    if (!colorMap.has(v.color)) colorMap.set(v.color, { color: v.color, image_url: v.image_url, sizes: [] });
    colorMap.get(v.color).sizes.push({ size: v.size, stock: v.stock });
  }
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
  for (const c of colorMap.values()) {
    c.sizes.sort((a, b) => {
      const ai = sizeOrder.indexOf(a.size), bi = sizeOrder.indexOf(b.size);
      return ai !== -1 && bi !== -1 ? ai - bi : a.size.localeCompare(b.size, undefined, { numeric: true });
    });
  }

  res.json({ success: true, product: { ...rows[0], images, colors: [...colorMap.values()] } });
}

export async function listCategories(req, res) {
  const [categories] = await pool.query("SELECT id, name, slug FROM categories ORDER BY id");
  res.json({ success: true, categories });
}

// Distinct filter options for the Shop page sidebar
export async function filterOptions(req, res) {
  const [brands] = await pool.query("SELECT DISTINCT brand FROM products ORDER BY brand");
  const [colors] = await pool.query("SELECT DISTINCT color FROM product_variants ORDER BY color");
  const [sizes] = await pool.query("SELECT DISTINCT size FROM product_variants");
  const [styles] = await pool.query("SELECT DISTINCT style FROM products ORDER BY style");
  res.json({
    success: true,
    brands: brands.map((r) => r.brand),
    colors: colors.map((r) => r.color),
    sizes: sizes.map((r) => r.size),
    styles: styles.map((r) => r.style),
    genders: ["Men", "Women"],
    occasions: ["College", "Interview", "Office", "Casual", "Party", "Date", "Wedding", "Festival", "Travel", "Gym", "Formal Event"],
  });
}
