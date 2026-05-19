import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notification.service.js";

export async function listNotifications(req, res) {
  const notifications = await getNotifications(req.user.id);
  res.json({ data: notifications });
}

export async function showUnreadNotificationCount(req, res) {
  const unreadCount = await getUnreadNotificationCount(req.user.id);
  res.json({ data: unreadCount });
}

export async function readNotification(req, res) {
  const notification = await markNotificationRead(req.validated.params.id, req.user.id);
  res.json({ data: notification });
}

export async function readAllNotifications(req, res) {
  const unreadCount = await markAllNotificationsRead(req.user.id);
  res.json({ data: unreadCount });
}
