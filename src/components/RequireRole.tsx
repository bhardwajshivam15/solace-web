import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, ROLE_HOME_PATH, type UserRole } from "../context/AuthContext";

/**
 * Guards an entire portal (/app, /listener, /admin). Not logged in -> bounce
 * to /login. Logged in as the wrong role -> bounce to that role's own home,
 * rather than letting them see a portal that isn't theirs.
 */
export default function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <>{children}</>;
}
