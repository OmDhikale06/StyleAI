import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listProducts, getProduct, filterOptions } from "../controllers/productController.js";
import { listReviews } from "../controllers/reviewController.js";

const router = Router();
// Static paths must come before "/:id"
router.get("/", asyncHandler(listProducts));
router.get("/filter", asyncHandler(listProducts));
router.get("/filter-options", asyncHandler(filterOptions));
router.get("/search/:keyword", asyncHandler(listProducts));
router.get("/:productId/reviews", asyncHandler(listReviews));
router.get("/:id", asyncHandler(getProduct));

export default router;
