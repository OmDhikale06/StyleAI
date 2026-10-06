import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { requireAuth, requireSelf } from "../middleware/auth.js";
import * as c from "../controllers/cartController.js";

const router = Router();
router.use(requireAuth);
router.post("/", h(c.addToCart));
router.post("/bulk", h(c.addBulk));
router.delete("/user/:userId", requireSelf, h(c.clearCart));
router.get("/:userId", requireSelf, h(c.getCart));
router.put("/:cartId", h(c.updateCartItem));
router.delete("/:cartId", h(c.removeCartItem));
router.post("/:cartId/to-wishlist", h(c.cartItemToWishlist));
export default router;
