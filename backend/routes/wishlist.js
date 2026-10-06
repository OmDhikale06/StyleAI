import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { requireAuth, requireSelf } from "../middleware/auth.js";
import * as w from "../controllers/wishlistController.js";

const router = Router();
router.use(requireAuth);
router.post("/", h(w.addToWishlist));
router.post("/:wishlistId/move-to-cart", h(w.moveToCart));
router.get("/:userId", requireSelf, h(w.getWishlist));
router.delete("/:wishlistId", h(w.removeFromWishlist));
export default router;
