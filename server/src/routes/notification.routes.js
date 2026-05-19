import { Router } from "express";
import {
  listNotifications,
  readAllNotifications,
  readNotification,
  showUnreadNotificationCount
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notificationParamsSchema } from "../validators/notification.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/notifications", asyncHandler(listNotifications));
router.get("/notifications/unread-count", asyncHandler(showUnreadNotificationCount));
router.patch(
  "/notifications/:id/read",
  validateMiddleware(notificationParamsSchema),
  asyncHandler(readNotification)
);
router.patch("/notifications/read-all", asyncHandler(readAllNotifications));

export default router;
