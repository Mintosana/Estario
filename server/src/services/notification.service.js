import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

function serializeNotification(notification) {
  return notification;
}

export async function createNotification({ body, targetUrl = null, title, type, userId }) {
  if (!userId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      body,
      targetUrl,
      title,
      type,
      userId
    }
  });
}

export async function getNotifications(userId) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return notifications.map(serializeNotification);
}

export async function getUnreadNotificationCount(userId) {
  const unreadNotifications = await prisma.notification.count({
    where: {
      userId,
      readAt: null
    }
  });

  return { unreadNotifications };
}

export async function markNotificationRead(id, userId) {
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!notification) {
    throw new AppError("Notificarea nu a fost gasita.", 404);
  }

  if (notification.readAt) {
    return serializeNotification(notification);
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() }
  });

  return serializeNotification(updatedNotification);
}

export async function markAllNotificationsRead(userId) {
  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  return getUnreadNotificationCount(userId);
}
