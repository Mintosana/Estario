import { Building2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function AppLayout({ children }) {
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

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
              <NavLink to="/my-listings">Anunturile mele</NavLink>
              <NavLink to="/listings/new">Adauga anunt</NavLink>
              {isAdmin ? <NavLink to="/admin">Administrare</NavLink> : null}
              <button className="nav-button" type="button" onClick={handleLogout}>
                Deconectare
              </button>
              <span className="user-chip">{user.name}</span>
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
    </div>
  );
}
