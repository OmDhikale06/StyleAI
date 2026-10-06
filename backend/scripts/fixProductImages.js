// Repairs image references in an already-populated StyleAI database without
// dropping tables, touching users/orders, or reseeding product data.
import mysql from "mysql2/promise";
import { config } from "../utils/config.js";

const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const conn = await mysql.createConnection(config.db);
try {
  await conn.beginTransaction();

  const [products] = await conn.query("SELECT id FROM products ORDER BY id");
  if (products.length !== 69) throw new Error(`Expected 69 products, found ${products.length}`);

  const [images] = await conn.query("SELECT id, product_id, display_order FROM product_images ORDER BY product_id, display_order");
  const byProduct = new Map();
  for (const row of images) {
    if (!byProduct.has(row.product_id)) byProduct.set(row.product_id, []);
    byProduct.get(row.product_id).push(row);
  }
  for (const p of products) {
    const rows = byProduct.get(p.id) || [];
    if (rows.length !== 4) throw new Error(`Product ${p.id} has ${rows.length} gallery rows; expected 4.`);
    for (const row of rows) {
      await conn.execute(
        "UPDATE product_images SET image_url = ? WHERE id = ?",
        [`/assets/products/${p.id}/${row.display_order}.svg`, row.id]
      );
    }
  }

  const [variants] = await conn.query("SELECT id, product_id, color FROM product_variants ORDER BY product_id, id");
  if (variants.length !== 854) throw new Error(`Expected 854 variants, found ${variants.length}`);
  for (const v of variants) {
    await conn.execute(
      "UPDATE product_variants SET image_url = ? WHERE id = ?",
      [`/assets/products/${v.product_id}/color-${slug(v.color)}.svg`, v.id]
    );
  }

  await conn.commit();
  console.log(`Updated ${images.length} gallery references and ${variants.length} variant references.`);
} catch (error) {
  await conn.rollback();
  console.error("Image migration rolled back:", error.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
