import { Router } from "express";
import {
  listListingMessages,
  storeMessage
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createMessageSchema,
  listingMessagesParamsSchema
} from "../validators/message.validator.js";

const router = Router();

router.post(
  "/listings/:id/messages",
  authMiddleware,
  validateMiddleware(createMessageSchema),
  asyncHandler(storeMessage)
);
router.get(
  "/my-listings/:id/messages",
  authMiddleware,
  validateMiddleware(listingMessagesParamsSchema),
  asyncHandler(listListingMessages)
);

export default router;
