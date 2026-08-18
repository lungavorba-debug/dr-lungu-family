import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSetup } from '../context/SetupContext';

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}

export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setupRequired, isLoading: setupLoading } = useSetup();
  const location = useLocation();

  if (authLoading || setupLoading) {
    return <LoadingScreen message="Se verifică sesiunea..." />;
  }
  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { setupRequired, isLoading: setupLoading } = useSetup();
  const location = useLocation();
  const isPasswordRecoveryRoute =
    location.pathname === '/forgot-password' || location.pathname === '/reset-password';

  if (authLoading || setupLoading) {
    return <LoadingScreen message="Se încarcă..." />;
  }

  if (setupRequired) {
    if (location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
    }
    return <Outlet />;
  }

  if (location.pathname === '/setup') {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && !isPasswordRecoveryRoute) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
