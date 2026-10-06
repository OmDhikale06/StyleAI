import express from "express";
import cors from "cors";
import { config } from "./utils/config.js";
import { checkConnection } from "./db/pool.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import recommendationRoutes from "./routes/recommendations.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import reviewRoutes from "./routes/reviews.js";

const app = express();

// CORS: keep production restricted to configured FRONTEND_URL values, while
// allowing the common Vite development ports on localhost/127.0.0.1.
// Requests without an Origin (curl, health checks, server-to-server calls)
// are allowed because they are not browser cross-origin requests.
const localDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

const allowedOrigins = new Set(
  config.isProd
    ? config.frontendOrigins
    : [...config.frontendOrigins, ...localDevOrigins]
);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "StyleAI API is running" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "StyleAI backend is healthy" });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, "0.0.0.0", async () => {
  console.log(`StyleAI backend listening on 0.0.0.0:${config.port}`);
  try {
    await checkConnection();
    console.log("MySQL connected");
  } catch (e) {
    console.warn("MySQL not reachable yet:", e.message);
  }
});
