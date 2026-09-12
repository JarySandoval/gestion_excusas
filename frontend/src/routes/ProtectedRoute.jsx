import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Verificando sesión institucional...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoleId = Number(user.id_rol);
  const normalizedAllowed = allowedRoles.map(Number);

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRoleId)) {
    // Redirigir al portal que le corresponde según su rol
    if (userRoleId === 3) {
      return <Navigate to="/portal/mis-excusas" replace />;
    } else {
      return <Navigate to="/admin/novedades" replace />;
    }
  }

  return children;
}
