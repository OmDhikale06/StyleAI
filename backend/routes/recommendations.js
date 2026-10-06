import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { recommend } from "../controllers/aiController.js";

const router = Router();
router.post("/", asyncHandler(recommend));
export default router;
