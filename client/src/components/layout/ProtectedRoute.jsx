import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function ProtectedRoute({ requireAdmin = false }) {
  const location = useLocation();
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-status">Se verifica sesiunea...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
