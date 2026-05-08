import { Building2, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getUnreadMessageCount } from "../../api/messagesApi.js";
import { resolveApiAssetUrl } from "../../api/axiosClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { CompareTray } from "../listings/CompareTray.jsx";

export function AppLayout({ children }) {
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadConversations, setUnreadConversations] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      if (!isAuthenticated) {
        setUnreadConversations(0);
        return;
      }

      try {
        const response = await getUnreadMessageCount();
        if (isMounted) {
          setUnreadConversations(response.data.unreadConversations);
        }
      } catch {
        if (isMounted) {
          setUnreadConversations(0);
        }
      }
    }

    loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
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
              <NavLink to="/listings/new">Adauga anunt</NavLink>
              {isAdmin ? (
                <NavLink className="admin-nav-link" to="/admin">
                  <Settings size={17} aria-hidden="true" />
                  Administrare
                </NavLink>
              ) : null}
              <NavLink className="user-chip" to="/profile">
                {user.avatarUrl ? (
                  <img src={resolveApiAssetUrl(user.avatarUrl)} alt="" />
                ) : (
                  <span className="user-chip-initials">{user.name?.slice(0, 1)}</span>
                )}
                <span>{user.name}</span>
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
    </div>
  );
}
