import jwt from "jsonwebtoken";
import { config } from "../utils/config.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "Login required." });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id, name: payload.name, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }
}

// Ensures :userId in the URL belongs to the logged-in user (used by cart/wishlist/orders)
export function requireSelf(req, res, next) {
  if (Number(req.params.userId) !== req.user.id) {
    return res.status(403).json({ success: false, message: "You can only access your own data." });
  }
  next();
}
