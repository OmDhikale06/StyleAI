import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { createReview } from "../controllers/reviewController.js";

const router = Router();
router.post("/", requireAuth, h(createReview));
export default router;
