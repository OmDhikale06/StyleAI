import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { requireAuth, requireSelf } from "../middleware/auth.js";
import * as o from "../controllers/orderController.js";

const router = Router();
router.use(requireAuth);
router.post("/", h(o.createOrder));
router.get("/:userId", requireSelf, h(o.listOrders));
router.get("/:userId/:orderId", requireSelf, h(o.getOrder));
export default router;
