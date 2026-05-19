import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../api/notificationsApi.js";
import { useToast } from "../context/ToastContext.jsx";

const notificationTypeLabels = {
  LISTING_APPROVED: "Anunt aprobat",
  LISTING_REJECTED: "Anunt respins",
  NEW_MESSAGE: "Mesaj"
};

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function NotificationsPage() {
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getNotifications();
        if (isMounted) {
          setNotifications(response.data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(getApiErrorMessage(apiError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  async function readNotification(notificationId) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId && !notification.readAt
          ? { ...notification, readAt: new Date().toISOString() }
          : notification
      )
    );

    try {
      await markNotificationRead(notificationId);
      window.dispatchEvent(new Event("estario:notifications-changed"));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  }

  async function readAllNotifications() {
    setIsMarkingAll(true);
    setError("");

    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? now
        }))
      );
      window.dispatchEvent(new Event("estario:notifications-changed"));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Notificari</h1>
          <p>Evenimente importante despre anunturi, moderare si mesaje.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={readAllNotifications}
          disabled={unreadCount === 0 || isMarkingAll}
        >
          <CheckCheck size={17} aria-hidden="true" />
          Marcheaza toate ca citite
        </button>
      </div>

      {isLoading ? <div className="page-status">Se incarca notificarile...</div> : null}

      {!isLoading && notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={28} aria-hidden="true" />
          <h2>Nu ai notificari inca</h2>
          <p>Aici vor aparea aprobarile, respingerile si mesajele noi.</p>
        </div>
      ) : null}

      {!isLoading && notifications.length > 0 ? (
        <div className="notification-list">
          {notifications.map((notification) => {
            const isUnread = !notification.readAt;

            return (
              <article
                className={`notification-item ${isUnread ? "notification-item-unread" : ""}`}
                key={notification.id}
              >
                <div className="notification-icon" aria-hidden="true">
                  <Bell size={19} />
                </div>
                <div className="notification-content">
                  <div className="notification-topline">
                    <div>
                      <span className="notification-type">
                        {notificationTypeLabels[notification.type] ?? "Notificare"}
                      </span>
                      <h2>{notification.title}</h2>
                    </div>
                    <span>{formatNotificationDate(notification.createdAt)}</span>
                  </div>
                  <p>{notification.body}</p>
                  <div className="notification-actions">
                    {notification.targetUrl ? (
                      <Link
                        className="secondary-button compact-button"
                        to={notification.targetUrl}
                        onClick={() => readNotification(notification.id)}
                      >
                        <ExternalLink size={15} aria-hidden="true" />
                        Deschide
                      </Link>
                    ) : null}
                    {isUnread ? (
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        onClick={() => readNotification(notification.id)}
                      >
                        Marcheaza ca citita
                      </button>
                    ) : (
                      <span className="notification-read-label">Citita</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
