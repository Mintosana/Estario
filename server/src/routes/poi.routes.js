import { Router } from "express";
import { listPointsOfInterest } from "../controllers/poi.controller.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { poiBoundsSchema } from "../validators/poi.validator.js";

const router = Router();

router.get(
  "/points-of-interest",
  validateMiddleware(poiBoundsSchema),
  asyncHandler(listPointsOfInterest)
);

export default router;
