import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signup, login } from "../controllers/authController.js";

const router = Router();
router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
export default router;
