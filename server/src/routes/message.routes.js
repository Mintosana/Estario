import { Router } from "express";
import {
  listInboxMessages,
  listConversations,
  listListingMessages,
  replyToConversation,
  showConversation,
  storeMessage
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  conversationParamsSchema,
  createMessageSchema,
  listingMessagesParamsSchema,
  replyMessageSchema
} from "../validators/message.validator.js";

const router = Router();

router.post(
  "/listings/:id/messages",
  authMiddleware,
  validateMiddleware(createMessageSchema),
  asyncHandler(storeMessage)
);
router.get(
  "/messages/inbox",
  authMiddleware,
  asyncHandler(listInboxMessages)
);
router.get(
  "/messages/conversations",
  authMiddleware,
  asyncHandler(listConversations)
);
router.get(
  "/messages/conversations/:id",
  authMiddleware,
  validateMiddleware(conversationParamsSchema),
  asyncHandler(showConversation)
);
router.post(
  "/messages/conversations/:id/messages",
  authMiddleware,
  validateMiddleware(replyMessageSchema),
  asyncHandler(replyToConversation)
);
router.get(
  "/my-listings/:id/messages",
  authMiddleware,
  validateMiddleware(listingMessagesParamsSchema),
  asyncHandler(listListingMessages)
);

export default router;
