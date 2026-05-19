import { Router } from "express";
import { buyPromotionBundleAction, sponsorListingAction } from "../controllers/promotion.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buyPromotionBundleSchema, sponsorListingSchema } from "../validators/promotion.validator.js";

const router = Router();

router.post(
  "/promotion/bundles",
  authMiddleware,
  validateMiddleware(buyPromotionBundleSchema),
  asyncHandler(buyPromotionBundleAction)
);

router.post(
  "/listings/:id/sponsor",
  authMiddleware,
  validateMiddleware(sponsorListingSchema),
  asyncHandler(sponsorListingAction)
);

export default router;
