import { Router } from "express";
import {
  destroyListing,
  destroyListingImage,
  editListing,
  listMyListings,
  listPublicListings,
  showListing,
  storeListing,
  uploadListingImages
} from "../controllers/listing.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.middleware.js";
import { uploadImages } from "../middleware/upload.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createListingSchema,
  listingFiltersSchema,
  listingIdParamsSchema,
  listingImageParamsSchema,
  updateListingSchema
} from "../validators/listing.validator.js";

const router = Router();

router.get("/listings", validateMiddleware(listingFiltersSchema), asyncHandler(listPublicListings));
router.get(
  "/listings/:id",
  optionalAuthMiddleware,
  validateMiddleware(listingIdParamsSchema),
  asyncHandler(showListing)
);
router.get("/my-listings", authMiddleware, asyncHandler(listMyListings));
router.post(
  "/listings",
  authMiddleware,
  validateMiddleware(createListingSchema),
  asyncHandler(storeListing)
);
router.put(
  "/listings/:id",
  authMiddleware,
  validateMiddleware(updateListingSchema),
  asyncHandler(editListing)
);
router.delete(
  "/listings/:id",
  authMiddleware,
  validateMiddleware(listingIdParamsSchema),
  asyncHandler(destroyListing)
);
router.post(
  "/listings/:id/images",
  authMiddleware,
  validateMiddleware(listingIdParamsSchema),
  uploadImages,
  asyncHandler(uploadListingImages)
);
router.delete(
  "/listings/:id/images/:imageId",
  authMiddleware,
  validateMiddleware(listingImageParamsSchema),
  asyncHandler(destroyListingImage)
);

export default router;
