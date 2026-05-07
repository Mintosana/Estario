import { Router } from "express";
import {
  destroySavedSearch,
  editSavedSearch,
  listSavedSearches,
  storeSavedSearch
} from "../controllers/savedSearch.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createSavedSearchSchema,
  savedSearchParamsSchema,
  updateSavedSearchSchema
} from "../validators/savedSearch.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/saved-searches", asyncHandler(listSavedSearches));
router.post(
  "/saved-searches",
  validateMiddleware(createSavedSearchSchema),
  asyncHandler(storeSavedSearch)
);
router.put(
  "/saved-searches/:id",
  validateMiddleware(updateSavedSearchSchema),
  asyncHandler(editSavedSearch)
);
router.delete(
  "/saved-searches/:id",
  validateMiddleware(savedSearchParamsSchema),
  asyncHandler(destroySavedSearch)
);

export default router;
