// Pure SQL builder for product listing. No DB access, so it is easy to test.
const SORTS = {
  price_asc: "p.price ASC, p.id ASC",
  price_desc: "p.price DESC, p.id ASC",
  rating: "p.rating DESC, p.review_count DESC, p.id ASC",
  popularity: "p.review_count DESC, p.rating DESC, p.id ASC",
  newest: "p.created_at DESC, p.id DESC",
};

const list = (v) =>
  v === undefined || v === null || v === ""
    ? []
    : String(v).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);

const num = (v) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

export function buildProductQuery(q = {}) {
  const where = [];
  const params = [];

  const inClause = (col, values) => {
    where.push(`${col} IN (${values.map(() => "?").join(",")})`);
    params.push(...values);
  };

  // Gender: Unisex products appear for both Men and Women
  const genders = list(q.gender);
  if (genders.length) {
    where.push(`(p.gender IN (${genders.map(() => "?").join(",")}) OR p.gender = 'Unisex')`);
    params.push(...genders);
  }

  // Category: slug. "men"/"women" slugs behave as gender filters.
  const cats = list(q.category).map((c) => c.toLowerCase());
  const genderCats = cats.filter((c) => c === "men" || c === "women");
  const realCats = cats.filter((c) => c !== "men" && c !== "women");
  if (genderCats.length) {
    const g = genderCats.map((c) => (c === "men" ? "Men" : "Women"));
    where.push(`(p.gender IN (${g.map(() => "?").join(",")}) OR p.gender = 'Unisex')`);
    params.push(...g);
  }
  if (realCats.length) inClause("c.slug", realCats);

  const brands = list(q.brand);
  if (brands.length) inClause("p.brand", brands);

  const styles = list(q.style);
  if (styles.length) inClause("p.style", styles);

  const occasions = list(q.occasion);
  if (occasions.length) {
    where.push("(" + occasions.map(() => "FIND_IN_SET(?, p.occasion) > 0").join(" OR ") + ")");
    params.push(...occasions);
  }

  const minPrice = num(q.minPrice);
  const maxPrice = num(q.maxPrice);
  if (minPrice !== null) { where.push("p.price >= ?"); params.push(minPrice); }
  if (maxPrice !== null) { where.push("p.price <= ?"); params.push(maxPrice); }

  const minRating = num(q.rating);
  if (minRating !== null) { where.push("p.rating >= ?"); params.push(minRating); }

  // Size / color: only products with an in-stock variant matching ALL given constraints
  const sizes = list(q.size);
  const colors = list(q.color);
  if (sizes.length || colors.length) {
    let sub = "EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.stock > 0";
    if (sizes.length) { sub += ` AND v.size IN (${sizes.map(() => "?").join(",")})`; params.push(...sizes); }
    if (colors.length) { sub += ` AND v.color IN (${colors.map(() => "?").join(",")})`; params.push(...colors); }
    where.push(sub + ")");
  }

  // Free-text search: every token must match name, brand, category, style or occasion
  const tokens = String(q.q || "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const t of tokens) {
    const like = `%${t.replace(/[%_\\]/g, "\\$&")}%`;
    where.push("(p.name LIKE ? OR p.brand LIKE ? OR c.name LIKE ? OR p.style LIKE ? OR p.occasion LIKE ? OR p.primary_color LIKE ?)");
    params.push(like, like, like, like, like, like);
  }

  const orderBy = SORTS[q.sort] || SORTS.popularity;
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(q.limit, 10) || 24));

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const from = "FROM products p JOIN categories c ON c.id = p.category_id";

  return {
    page,
    limit,
    listSql: `SELECT p.id, p.name, p.brand, p.price, p.original_price, p.discount, p.gender, p.style, p.occasion,
      p.outfit_role, p.primary_color, p.rating, p.review_count, p.stock, c.name AS category, c.slug AS category_slug,
      (SELECT image_url FROM product_images i WHERE i.product_id = p.id ORDER BY i.display_order LIMIT 1) AS image
      ${from} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    listParams: [...params, limit, (page - 1) * limit],
    countSql: `SELECT COUNT(*) AS total ${from} ${whereSql}`,
    countParams: params,
  };
}
