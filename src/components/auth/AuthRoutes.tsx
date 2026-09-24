import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

function AuthLoadingPlaceholder() {
  return <div className="min-h-screen w-full bg-canvas" aria-hidden="true" />;
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingPlaceholder />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingPlaceholder />;
  }

  if (user) {
    return <Navigate to="/overview" replace />;
  }

  return <Outlet />;
}

export function RootRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingPlaceholder />;
  }

  if (user) {
    return <Navigate to="/overview" replace />;
  }

  return <>{children}</>;
}
