import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateMiddleware(registerSchema), asyncHandler(register));
router.post("/login", validateMiddleware(loginSchema), asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(me));

export default router;
