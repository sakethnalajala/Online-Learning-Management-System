import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext';
import { PageLoader } from '../ui';

/**
 * Gate for any authenticated area. Frontend routing is a convenience only —
 * every API the page calls enforces the same rules server-side.
 */
export function ProtectedRoute() {
  const { isAuthenticated, booting } = useAuth();
  const location = useLocation();

  if (booting) return <PageLoader label="Restoring your session" />;

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

/** Restricts a branch of the route tree to specific roles. */
export function RoleRoute({ allow }) {
  const { user, booting } = useAuth();

  if (booting) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  // Send someone to their own dashboard rather than showing a dead end.
  if (!allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return <Outlet />;
}

/** Keeps signed-in users off the login and register screens. */
export function GuestRoute() {
  const { isAuthenticated, user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={location.state?.from || homeFor(user.role)} replace />;
  }

  return <Outlet />;
}
