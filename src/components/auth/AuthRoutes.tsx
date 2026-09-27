import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { getNativeAuthCallbackDestination } from '../../lib/auth-redirect';

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
  const native = Capacitor.getPlatform() === 'android';
  const [callbackDestination, setCallbackDestination] = useState<string | null | undefined>(native ? undefined : null);

  useEffect(() => {
    if (!native) return;

    let active = true;
    void App.getLaunchUrl()
      .then(async (launchUrl) => {
        const destination = launchUrl?.url ? await getNativeAuthCallbackDestination(launchUrl.url) : null;
        if (active) setCallbackDestination(destination);
      })
      .catch(() => {
        if (active) setCallbackDestination(null);
      });

    return () => {
      active = false;
    };
  }, [native]);

  if (loading || callbackDestination === undefined) {
    return <AuthLoadingPlaceholder />;
  }

  if (callbackDestination) {
    return <Navigate to={callbackDestination} replace />;
  }

  if (native) {
    return <Navigate to={user ? "/overview" : "/login"} replace />;
  }

  if (user) {
    return <Navigate to="/overview" replace />;
  }

  return <>{children}</>;
}
