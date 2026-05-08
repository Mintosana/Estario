import { Router } from "express";
import { showOwnerProfile } from "../controllers/owner.controller.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ownerParamsSchema } from "../validators/owner.validator.js";

const router = Router();

router.get("/owners/:id", validateMiddleware(ownerParamsSchema), asyncHandler(showOwnerProfile));

export default router;
