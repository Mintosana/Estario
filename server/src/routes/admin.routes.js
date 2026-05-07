import { Router } from "express";
import {
  approveListingAction,
  listPendingListings,
  listRejectedListings,
  rejectListingAction
} from "../controllers/admin.controller.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  adminListingParamsSchema,
  rejectListingSchema
} from "../validators/admin.validator.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/admin/listings/pending", asyncHandler(listPendingListings));
router.get("/admin/listings/rejected", asyncHandler(listRejectedListings));
router.patch(
  "/admin/listings/:id/approve",
  validateMiddleware(adminListingParamsSchema),
  asyncHandler(approveListingAction)
);
router.patch(
  "/admin/listings/:id/reject",
  validateMiddleware(rejectListingSchema),
  asyncHandler(rejectListingAction)
);

export default router;
