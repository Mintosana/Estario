import { Bell, Building2, ExternalLink, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getUnreadMessageCount } from "../../api/messagesApi.js";
import { getNotifications, getUnreadNotificationCount, markNotificationRead } from "../../api/notificationsApi.js";
import { resolveApiAssetUrl } from "../../api/axiosClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { CompareTray } from "../listings/CompareTray.jsx";
import { ScrollToTopButton } from "./ScrollToTopButton.jsx";

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
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AppLayout({ children }) {
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notificationMenuRef = useRef(null);
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationDropdownLoading, setIsNotificationDropdownLoading] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      if (!isAuthenticated) {
        setUnreadConversations(0);
        setUnreadNotifications(0);
        return;
      }

      try {
        const [messageResponse, notificationResponse] = await Promise.all([
          getUnreadMessageCount(),
          getUnreadNotificationCount()
        ]);
        if (isMounted) {
          setUnreadConversations(messageResponse.data.unreadConversations);
          setUnreadNotifications(notificationResponse.data.unreadNotifications);
        }
      } catch {
        if (isMounted) {
          setUnreadConversations(0);
          setUnreadNotifications(0);
        }
      }
    }

    loadUnreadCount();
    window.addEventListener("estario:notifications-changed", loadUnreadCount);

    return () => {
      isMounted = false;
      window.removeEventListener("estario:notifications-changed", loadUnreadCount);
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!notificationMenuRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isNotificationsOpen]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function toggleNotifications() {
    const shouldOpen = !isNotificationsOpen;
    setIsNotificationsOpen(shouldOpen);

    if (!shouldOpen || !isAuthenticated) {
      return;
    }

    setIsNotificationDropdownLoading(true);

    try {
      const response = await getNotifications();
      setLatestNotifications(response.data.slice(0, 5));
    } catch {
      setLatestNotifications([]);
    } finally {
      setIsNotificationDropdownLoading(false);
    }
  }

  async function openNotification(notification) {
    setLatestNotifications((current) =>
      current.map((item) =>
        item.id === notification.id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item
      )
    );

    if (!notification.readAt) {
      try {
        await markNotificationRead(notification.id);
        window.dispatchEvent(new Event("estario:notifications-changed"));
      } catch {
        setLatestNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, readAt: notification.readAt } : item))
        );
      }
    }

    setIsNotificationsOpen(false);

    if (notification.targetUrl) {
      navigate(notification.targetUrl);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Estario">
          <Building2 size={24} aria-hidden="true" />
          <span>Estario</span>
        </NavLink>
        <nav className="main-nav" aria-label="Navigatie principala">
          <NavLink to="/">Anunturi</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/favorites">Favorite</NavLink>
              <NavLink className="nav-message-link" to="/messages">
                Mesaje
                {unreadConversations > 0 ? <span className="nav-badge">{unreadConversations}</span> : null}
              </NavLink>
              <NavLink to="/my-listings">Anunturile mele</NavLink>
              {isAdmin ? (
                <NavLink className="admin-nav-link" to="/admin">
                  <Settings size={17} aria-hidden="true" />
                  Administrare
                </NavLink>
              ) : null}
              <div className="notification-menu" ref={notificationMenuRef}>
                <button
                  className={`nav-button notification-trigger ${isNotificationsOpen ? "notification-trigger-open" : ""}`}
                  type="button"
                  onClick={toggleNotifications}
                  aria-expanded={isNotificationsOpen}
                  aria-label="Notificari"
                >
                  <Bell size={20} aria-hidden="true" />
                  {unreadNotifications > 0 ? <span className="nav-badge notification-badge">{unreadNotifications}</span> : null}
                </button>
                {isNotificationsOpen ? (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <strong>Notificari recente</strong>
                      {unreadNotifications > 0 ? <span>{unreadNotifications} necitite</span> : <span>La zi</span>}
                    </div>
                    {isNotificationDropdownLoading ? (
                      <div className="notification-dropdown-status">Se incarca...</div>
                    ) : null}
                    {!isNotificationDropdownLoading && latestNotifications.length === 0 ? (
                      <div className="notification-dropdown-status">Nu ai notificari recente.</div>
                    ) : null}
                    {!isNotificationDropdownLoading && latestNotifications.length > 0 ? (
                      <div className="notification-dropdown-list">
                        {latestNotifications.map((notification) => {
                          const isUnread = !notification.readAt;

                          return (
                            <button
                              className={`notification-dropdown-item ${isUnread ? "notification-dropdown-item-unread" : ""}`}
                              type="button"
                              key={notification.id}
                              onClick={() => openNotification(notification)}
                            >
                              <span>{notificationTypeLabels[notification.type] ?? "Notificare"}</span>
                              <strong>{notification.title}</strong>
                              <p>{notification.body}</p>
                              <small>{formatNotificationDate(notification.createdAt)}</small>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <Link className="notification-dropdown-more" to="/notifications">
                      <ExternalLink size={15} aria-hidden="true" />
                      Vezi toate
                    </Link>
                  </div>
                ) : null}
              </div>
              <NavLink className="user-chip user-chip-icon-only" to="/profile" aria-label="Profil">
                {user.avatarUrl ? (
                  <img src={resolveApiAssetUrl(user.avatarUrl)} alt="" />
                ) : (
                  <span className="user-chip-initials">{user.name?.slice(0, 1)}</span>
                )}
              </NavLink>
              <button className="nav-button logout-button" type="button" onClick={handleLogout} aria-label="Deconectare">
                <LogOut size={19} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Autentificare</NavLink>
              <NavLink to="/register">Inregistrare</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <CompareTray />
      <ScrollToTopButton />
    </div>
  );
}
