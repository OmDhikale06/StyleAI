// End-to-end API check. Start the backend first, then:  npm run smoke
// Use API_URL to test a deployed backend:  API_URL=https://your-api.onrender.com npm run smoke
const BASE = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
let pass = 0, fail = 0;

async function call(method, path, { body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

console.log(`Smoke test against ${BASE}\n`);
try {
  let r = await call("GET", "/");
  check("GET / is running", r.status === 200 && r.data.message === "StyleAI API is running");
  r = await call("GET", "/health");
  check("GET /health", r.status === 200 && r.data.message === "StyleAI backend is healthy");

  r = await call("GET", "/api/categories");
  check("15 categories", r.data.categories?.length === 15, `got ${r.data.categories?.length}`);

  r = await call("GET", "/api/products?limit=60");
  check("40+ products", r.data.pagination?.total >= 40, `total ${r.data.pagination?.total}`);
  r = await call("GET", "/api/products/search/shirt");
  check("search 'shirt'", r.data.products?.length > 0);
  r = await call("GET", "/api/products/filter?gender=Men&maxPrice=1500&sort=price_asc&limit=60");
  const prices = (r.data.products || []).map((p) => p.price);
  check("filter + sort", prices.length > 0 && prices.every((x) => Number(x) <= 1500) && prices.every((x, i) => i === 0 || Number(x) >= Number(prices[i - 1])));

  const list = (await call("GET", "/api/products?sort=price_asc&limit=60")).data.products;
  r = await call("GET", `/api/products/${list[0].id}`);
  const prod = r.data.product;
  check("product detail: 4 images + variants", prod?.images?.length >= 3 && prod?.colors?.length > 0, `images ${prod?.images?.length}`);
  check("product 9999 -> 404", (await call("GET", "/api/products/9999")).status === 404);

  const email = `smoke${Date.now()}@example.com`;
  r = await call("POST", "/api/auth/signup", { body: { name: "Smoke Test", email, password: "secret123", confirmPassword: "secret123" } });
  check("signup", r.status === 201 && !!r.data.token, r.data.message);
  const token = r.data.token, uid = r.data.user?.id;
  check("duplicate signup -> 409", (await call("POST", "/api/auth/signup", { body: { name: "Smoke Test", email, password: "secret123" } })).status === 409);
  check("wrong password -> 401", (await call("POST", "/api/auth/login", { body: { email, password: "nope" } })).status === 401);
  r = await call("POST", "/api/auth/login", { body: { email, password: "secret123" } });
  check("login", r.status === 200 && !!r.data.token);

  r = await call("POST", "/api/ai/stylist", { body: { query: "I have an interview tomorrow and my budget is ₹5000, I'm a guy" } });
  const o = r.data.outfit;
  check("AI stylist builds an outfit", r.status === 200 && o?.items?.length >= 3 && /^Recommended because/.test(o.explanation || ""), r.data.message);
  check("outfit respects budget", o && o.total <= 5000, `total ${o?.total}`);
  r = await call("POST", "/api/recommendations", { body: { gender: "Women", occasion: "Party", style: "Party", budget: 5000 } });
  check("POST /api/recommendations", r.status === 200 && r.data.outfit?.items?.length >= 2);
  check("bad recommendation input -> 400", (await call("POST", "/api/recommendations", { body: { gender: "Men" } })).status === 400);
  r = await call("POST", "/api/ai/complete-look", { body: { productId: list[0].id } });
  check("complete the look", r.status === 200 && r.data.outfit?.items?.length >= 2);

  check("cart without login -> 401", (await call("GET", `/api/cart/${uid}`)).status === 401);
  check("other user's cart -> 403", (await call("GET", "/api/cart/999999", { token })).status === 403);
  check("add to cart without size -> 400", (await call("POST", "/api/cart", { token, body: { productId: prod.id, color: prod.colors[0].color } })).status === 400);

  const color = prod.colors.find((c) => c.sizes.some((s) => s.stock > 0));
  const size = color.sizes.find((s) => s.stock > 0).size;
  r = await call("POST", "/api/cart", { token, body: { productId: prod.id, color: color.color, size, quantity: 1 } });
  check("add to cart", r.status === 201 && r.data.items?.length === 1);
  const cartId = r.data.items?.[0]?.cart_id;
  r = await call("PUT", `/api/cart/${cartId}`, { token, body: { quantity: 2 } });
  check("update quantity + totals", r.status === 200 && r.data.summary?.items === 2 && r.data.summary.total > 0);
  r = await call("GET", `/api/cart/${uid}`, { token });
  check("cart persists", r.data.items?.length === 1 && r.data.items[0].selected_size === size);

  r = await call("POST", "/api/wishlist", { token, body: { productId: list[1].id } });
  check("wishlist add", r.status === 201 && r.data.items?.length === 1);
  r = await call("DELETE", `/api/wishlist/${r.data.items?.[0]?.wishlist_id}`, { token });
  check("wishlist remove", r.status === 200 && r.data.items?.length === 0);

  const ship = { fullName: "Smoke Test", email, phone: "9876543210", address: "12 Test Street", city: "Pune", state: "Maharashtra", pincode: "411001" };
  check("order with bad phone -> 400", (await call("POST", "/api/orders", { token, body: { shipping: { ...ship, phone: "123" }, paymentMethod: "COD" } })).status === 400);
  r = await call("POST", "/api/orders", { token, body: { shipping: ship, paymentMethod: "Cash on Delivery" } });
  check("place order", r.status === 201 && /^#STY\d{5}$/.test(r.data.order?.orderCode || ""), r.data.message);
  const orderId = r.data.order?.orderId;
  check("cart cleared after order", (await call("GET", `/api/cart/${uid}`, { token })).data.items?.length === 0);
  r = await call("GET", `/api/orders/${uid}`, { token });
  check("order history", r.data.orders?.length === 1 && r.data.orders[0].status === "Placed");
  r = await call("GET", `/api/orders/${uid}/${orderId}`, { token });
  check("order details", r.data.order?.items?.length === 1);
  check("empty-cart order -> 400", (await call("POST", "/api/orders", { token, body: { shipping: ship, paymentMethod: "COD" } })).status === 400);

  r = await call("POST", "/api/reviews", { token, body: { productId: prod.id, rating: 5, comment: "Great quality, smoke test review." } });
  check("submit review", r.status === 201, r.data.message);
  r = await call("GET", `/api/products/${prod.id}/reviews`);
  check("list reviews", r.data.reviews?.some((x) => x.user_name === "Smoke Test"));
} catch (e) {
  fail++;
  console.log("  FAIL  could not reach the API:", e.message);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
