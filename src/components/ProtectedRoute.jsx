import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-600">Verifying your session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    const fallback = role === "admin" ? "/admin" : "/";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
