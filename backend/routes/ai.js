import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { stylist, completeLook } from "../controllers/aiController.js";

const router = Router();
router.post("/stylist", asyncHandler(stylist));
router.post("/complete-look", asyncHandler(completeLook));
export default router;
