import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, ROLE_HOME_PATH, type UserRole } from "../context/AuthContext";

/**
 * Guards an entire portal (/app, /listener, /admin). Not logged in -> bounce
 * to the landing page (this is also what fires automatically the moment a
 * session dies mid-use — see AuthContext's onUnauthorized/storage-event
 * handling, both of which just clear auth state and let this component do
 * the actual redirecting). Logged in as the wrong role -> bounce to that
 * role's own home, rather than letting them see a portal that isn't theirs.
 */
export default function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <>{children}</>;
}
