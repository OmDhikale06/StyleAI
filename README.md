# StyleAI — Your AI-Powered Personal Stylist

> *"Tell StyleAI where you're going, your style and your budget — and StyleAI tells you what to wear."*

StyleAI is a full-stack fashion shopping platform. Traditional stores ask **"What product do you want?"** StyleAI asks **"What are you dressing for?"** and recommends a *complete, colour-matched outfit* with a plain-English explanation of why each piece was chosen.

**Stack:** React + Vite · Node.js + Express · MySQL · content-based recommendation engine (no paid AI API needed)

---

## Table of contents
1. [Problem statement](#problem-statement) · 2. [Objectives](#objectives) · 3. [Features](#features) · 4. [AI recommendation system](#ai-recommendation-system) · 5. [Architecture](#architecture) · 6. [Folder structure](#folder-structure) · 7. [Database design](#database-design) · 8. [API documentation](#api-documentation) · 9. [Local setup](#local-setup) · 10. [GitHub setup](#github-setup) · 11. [Deployment (Render)](#deployment-render) · 12. [Troubleshooting](#troubleshooting) · 13. [Demo flow](#demo-flow) · 14. [Future scope](#future-scope)

## Problem statement
Users often struggle to decide what to wear for different occasions and spend significant time browsing through large numbers of fashion products without knowing how to combine them into a suitable outfit.

**Solution.** StyleAI combines AI-based fashion recommendation + e-commerce + personalised outfit generation + budget-aware shopping + occasion-aware recommendations.

## Objectives
1. To develop an AI-powered fashion recommendation platform.
2. To recommend complete outfits based on occasion, style, budget and user preferences.
3. To provide a modern e-commerce shopping experience.
4. To implement personalized product recommendations.
5. To integrate authentication, cart, wishlist and order management.
6. To store user and shopping data using MySQL.
7. To deploy the application using GitHub and Render.

## Features
- **AI Stylist** — pick gender, occasion, style, budget, colour, season and fit, *or* just type "I have a college presentation tomorrow under ₹3000".
- **Complete outfits** with per-item reasons, match scores, score breakdowns, alternatives and a "Why this look?" explanation.
- **Complete Your Look** on every product page, with one-click *Add Complete Look*.
- **Shop** — search (name, brand, category, style, occasion), filters (gender, category, price, size, colour, brand, rating, style, occasion), 5 sort orders, pagination. Filters live in the URL.
- **Product page** — 4-image gallery, colour swatches that swap the image, size selector with stock, quantity, Buy Now, wishlist, reviews.
- **Accounts** — signup/login (bcrypt + JWT). Cart, wishlist and orders are per-user and stored in MySQL.
- **Checkout** — Cash on Delivery or *demo* online payment (no real gateway). Orders are placed in a database **transaction** with stock locking and rollback.
- **Order history** with status timeline (Placed → Processing → Shipped → Delivered).
- Loading, empty, error and success states throughout; responsive from phone to desktop.

## AI recommendation system
A genuine **content-based, explainable** recommender. Every product carries metadata: `gender`, `style`, `occasion` (list), `outfit_role`, `primary_color`, `color_palette`, `price`, `rating`.

### 1. Understanding the request
`services/nlpParser.js` extracts gender, occasion, style, budget (`₹3000`, `3k`, `under 5000`, `10000+`), colour, season and fit from free text using keyword and pattern matching. Explicit form fields always override the text. If the style isn't mentioned, a sensible default for the occasion is used (e.g. Interview → Formal).

### 2. Scoring each product (0–100)
| Factor | Weight | How it is computed |
|---|---|---|
| Occasion match | **30%** | 1.0 if the product lists the occasion; 0.35 for a related occasion (e.g. Office ↔ Interview) |
| Style match | **20%** | 1.0 exact, 0.5 for a related style (Smart Casual ↔ Formal); a 2nd/3rd preferred style counts 0.8 / 0.6 |
| Gender match | **15%** | 1.0 exact, 0.8 unisex, 0 otherwise (excluded) |
| Budget fit | **15%** | Each slot gets a share of the budget; full marks within the share, decaying linearly above it |
| Colour match | **10%** | Preferred colour (1.0 / 0.6 if in the palette) blended with how well it pairs with items already chosen |
| Rating | **10%** | `rating / 5` |

Season and fit preferences add or remove up to ±3 points as a tie-break (e.g. linen in summer, hoodies in winter, "slim" in the description for a slim-fit preference).

### 3. Building the complete outfit
`services/recommender.js` uses an **occasion template** of slots, e.g. Interview = top + bottom + shoes + accessory; College = top + bottom + shoes + bag; Wedding (men) = kurta + churidar + mojari + accessory; Wedding (women) = saree *or* kurta + footwear + accessory. For women it also tries a dress-based outfit and keeps the better one.

Slots are filled greedily, most important first. Each later pick is scored **in the context of what was already chosen**, so colours coordinate.

### 4. Staying within budget
If the total exceeds the budget, the engine repeatedly swaps in the cheaper alternative with the **smallest score loss per rupee saved**, then drops optional items (layer, bag, accessory). If the budget is impossible for the catalogue it returns the closest outfit and clearly says it is over budget.

### 5. Explanation
Every item gets a reason (occasion, style, colour pairing, budget share, rating), its score breakdown by factor, and two alternatives. The outfit gets a *"Recommended because this outfit matches your formal style, is appropriate for an interview and stays within your ₹5,000 budget…"* summary.

**Complete the Look** reuses the same engine with the viewed product *fixed* in its slot and the rest chosen around it.

## Architecture
```
React (Vite)  ──HTTPS/JSON──▶  Express API  ──mysql2 pool──▶  MySQL
 │ context: auth, cart, wishlist     │ routes → controllers → services (pricing, recommender, orders)
 └ pages / components                └ JWT auth middleware · validation · central error handler
```
- Prices are **always** read from the database; the frontend never sends prices.
- Cart/wishlist/order routes require a JWT and verify ownership.

## Folder structure
```
StyleAI/
├── frontend/            React + Vite app
│   └── src/ components/ pages/ context/ services/ utils/ data/
├── backend/
│   ├── server.js  routes/  controllers/  services/  middleware/  db/  utils/
│   └── scripts/         setupDb.js (create + seed DB) · smokeTest.js (API check)
├── database/            schema.sql · seed.sql
├── render.yaml          Render Blueprint
└── README.md
```

## Database design
Ten InnoDB tables with primary/foreign keys, unique constraints and indexes: `users`, `categories`, `products`, `product_images`, `product_variants`, `wishlist`, `cart`, `orders`, `order_items`, `reviews`.

Notable decisions: `UNIQUE(email)`; `UNIQUE(product, color, size)` on variants; `UNIQUE(user, product, size, color)` on cart; `order_items` snapshot the name and unit price at purchase; `orders.order_code` like `#STY00042`; one review per user per product.

Seed data: **69 products** (men's, women's and unisex — 12 shoes, 9 accessories, 4 bags), ~850 size/colour variants, 4 images per product and ~275 reviews.

## API documentation
Base URL: `http://localhost:5000`. 🔒 = needs `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/`, `/health` | Status checks |
| GET | `/api/categories` | All categories |
| GET | `/api/products` · `/api/products/filter` | List with `q gender category minPrice maxPrice size color brand rating style occasion sort page limit` |
| GET | `/api/products/search/:keyword` | Keyword search |
| GET | `/api/products/filter-options` | Brands, colours, sizes, styles for filter UI |
| GET | `/api/products/:id` | Detail with images and colour→size variants |
| GET | `/api/products/:productId/reviews` | Reviews + star distribution |
| POST | `/api/auth/signup` · `/api/auth/login` | Returns `{ user, token }` |
| POST | `/api/recommendations` | Outfit from `{gender, occasion, style?, budget?, color?, season?, fit?}` |
| POST | `/api/ai/stylist` | Same, plus free-text `query` |
| POST | `/api/ai/complete-look` | `{productId}` → complementary items |
| GET 🔒 | `/api/cart/:userId` | Cart with totals |
| POST 🔒 | `/api/cart` | `{productId, size, color, quantity}` |
| POST 🔒 | `/api/cart/bulk` | Add a whole look atomically |
| PUT 🔒 | `/api/cart/:cartId` | `{quantity}` |
| DELETE 🔒 | `/api/cart/:cartId` · `/api/cart/user/:userId` | Remove one / clear |
| GET/POST 🔒 | `/api/wishlist/:userId` · `/api/wishlist` | List / add `{productId}` |
| POST 🔒 | `/api/wishlist/:id/move-to-cart` | `{size, color}` |
| DELETE 🔒 | `/api/wishlist/:wishlistId` | Remove |
| POST 🔒 | `/api/orders` | `{shipping, paymentMethod}` — transactional |
| GET 🔒 | `/api/orders/:userId` · `/api/orders/:userId/:orderId` | History / details |
| POST 🔒 | `/api/reviews` | `{productId, rating, comment}` |

Errors use `{ "success": false, "message": "…" }` with proper status codes (400, 401, 403, 404, 409).

## Image system

The demo catalog now uses browser-loadable remote fashion photography through `frontend/src/utils/imageResolver.js`. This replaces the old SVG product artwork at runtime without changing the MySQL product schema or catalog data. The browser needs internet access to display these images. See `IMAGE_SOURCES.md` for notes and the recommended production approach of hosting/licensing the final assets locally or on a CDN.

## Local setup
**Prerequisites:** Node 18+, MySQL 8+ (or MariaDB 10.5+).

```bash
git clone <your-repo-url> StyleAI && cd StyleAI

# 1. Backend
cd backend
npm install
cp .env.example .env        # then edit DB_PASSWORD
npm run db:setup            # creates ai_fashion_db, tables and seed data
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm run dev                 # http://localhost:5173
```

**Verify images:** the frontend image resolver maps the existing catalog to browser-loadable remote fashion photography at runtime; no database image migration is required.

**Verify the API:** with the backend running, `cd backend && npm run smoke` runs ~35 checks (products, filters, auth, AI, cart, wishlist, checkout, orders, reviews).

### MySQL setup without the script
```bash
mysql -u root -p < database/schema.sql          # WARNING: drops and recreates StyleAI tables
mysql -u root -p ai_fashion_db < database/seed.sql
```
Demo review authors in the seed cannot log in; create your own account on the Sign up page.

### Environment variables
| File | Variable | Purpose |
|---|---|---|
| backend/.env | `PORT` | API port (Render sets this automatically) |
| | `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | MySQL connection |
| | `DB_SSL` | `true` for hosted MySQL that requires TLS |
| | `FRONTEND_URL` | Allowed CORS origin(s), comma-separated, no trailing slash |
| | `JWT_SECRET` | Long random string (required in production) |
| | `NODE_ENV` | `production` on Render |
| frontend/.env | `VITE_API_URL` | Backend base URL (baked in at build time) |

Never commit `.env` files — `.gitignore` already excludes them.

## GitHub setup
```bash
cd StyleAI
git init
git add .
git status                       # confirm no .env or node_modules are listed
git commit -m "StyleAI: initial commit"
git branch -M main
git remote add origin https://github.com/<you>/StyleAI.git
git push -u origin main
```

## Deployment (Render)
You deploy three pieces: **database → backend → frontend**.

### 1. Hosted MySQL
Render does not host MySQL, so use any MySQL-compatible provider (for example Aiven, Railway or TiDB Cloud — check current plans). Note its host, port, user, password and database name, then load the data from your computer:
```bash
cd backend
# put the hosted credentials in backend/.env (and DB_SSL=true if required)
npm run db:setup
```

### 2. Backend + frontend with the Blueprint
1. Push the repo to GitHub.
2. Render → **New → Blueprint** → select the repo. Render reads `render.yaml` and creates **styleai-api** (web service) and **styleai-web** (static site).
3. Fill the prompted variables:

**styleai-api (production)**
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME   (from your hosted MySQL)
DB_SSL=true                                        (set false if your provider has no TLS)
FRONTEND_URL=https://<your-static-site>.onrender.com
NODE_ENV=production      JWT_SECRET (auto-generated)
```
**styleai-web (production)**
```
VITE_API_URL=https://<your-api>.onrender.com
```
4. Deploy. Because each URL is only known after the first deploy, set `FRONTEND_URL` and `VITE_API_URL` afterwards and **redeploy the static site** (Vite bakes `VITE_API_URL` in at build time).
5. Check `https://<your-api>.onrender.com/health`, then run `API_URL=https://<your-api>.onrender.com npm run smoke` locally.

The static site's rewrite rule (`/* → /index.html`) makes page refresh and deep links work. Free-tier services sleep when idle, so the first request can take ~30–60 s.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Frontend shows "Cannot reach the server" | Backend not running, or `VITE_API_URL` wrong. Restart Vite after editing `.env`. |
| CORS error in the browser console | `FRONTEND_URL` must exactly match the site origin (no trailing slash, https in production). |
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER`/`DB_PASSWORD`. |
| `ECONNREFUSED 3306` | MySQL isn't running or `DB_HOST`/`DB_PORT` is wrong. |
| `Unknown database` | Run `npm run db:setup` (local) or create the database in your provider's console. |
| Hosted DB: SSL/TLS error | Set `DB_SSL=true` (or `false` if the provider doesn't support TLS). |
| `JWT_SECRET must be set in production` | Add `JWT_SECRET` to the backend's environment. |
| Blank page after deploy / 404 on refresh | Make sure the static site has the rewrite rule from `render.yaml`. |
| Product images look random | The seed uses placeholder photos so they never break. Replace `image_url` values with real fashion images (`UPDATE product_images SET image_url = …`). |
| "Login required." | Cart, wishlist and orders need an account. Sign up first. |

## Demo flow (3–5 minutes)
1. Open StyleAI and show the homepage. 2. Click **Interview**. 3. The AI Stylist opens with Interview selected — choose *Men* and *₹5000*, click **Generate my look**. 4. Show the outfit, **match scores**, **"How this was scored"** and **"Why this look?"**. 5. Open the recommended shirt; click the thumbnails; pick a **colour** and **size**. 6. **Add to Cart**. 7. Scroll to **Complete Your Look** and click **Add Complete Look**. 8. Open the cart, then **Checkout** and **Place Order**. 9. Show the order ID, then **My Orders**. 10. Explain: React frontend → Node/Express API → MySQL, with the recommendation engine in `services/recommender.js`. 11. Show the live deployed site.

## Future scope
LLM-powered stylist chat · virtual try-on · image-based outfit analysis · weather-based recommendations · body-shape and smart size prediction · voice stylist · fashion trend analysis · AI-generated fashion images · real payment gateway · delivery tracking.

The recommender is a pure module (`services/recommender.js`), so an LLM can be added behind the same interface for query understanding or richer explanations without touching the rest of the app.
