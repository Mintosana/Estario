import { axiosClient } from "./axiosClient.js";

export async function getNotifications() {
  const response = await axiosClient.get("/notifications");
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await axiosClient.get("/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await axiosClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await axiosClient.patch("/notifications/read-all");
  return response.data;
}
