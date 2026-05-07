import { Router } from "express";
import {
  destroyFavorite,
  listFavorites,
  storeFavorite
} from "../controllers/favorite.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { favoriteParamsSchema } from "../validators/favorite.validator.js";

const router = Router();

router.get("/favorites", authMiddleware, asyncHandler(listFavorites));
router.post(
  "/favorites/:listingId",
  authMiddleware,
  validateMiddleware(favoriteParamsSchema),
  asyncHandler(storeFavorite)
);
router.delete(
  "/favorites/:listingId",
  authMiddleware,
  validateMiddleware(favoriteParamsSchema),
  asyncHandler(destroyFavorite)
);

export default router;
