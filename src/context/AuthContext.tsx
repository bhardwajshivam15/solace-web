import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, onUnauthorized } from "../lib/apiClient";
import { clearKeys, recoverOrRegisterKeys } from "../lib/e2ee";

export type UserRole = "speaker" | "listener" | "admin";

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  admin: "/admin",
  listener: "/listener",
  speaker: "/app/home",
};

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  token?: string;
}

interface RegisterPayload {
  role: "speaker" | "listener";
  name: string;
  email: string;
  password: string;
  /** Required when role is "listener" — every listener needs at least one category. */
  topics?: string[];
  bio?: string;
  languages?: string[];
  pricePerMinute?: number;
  /** Required (must all be true) when role is "listener". */
  termsAccepted?: boolean;
  guidelinesAccepted?: boolean;
  confidentialityAccepted?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  reactivateAccount: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
}

const STORAGE_KEY = "solace.auth";

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): { user: AuthUser; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredAuth();
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  // Read from inside the onUnauthorized callback below, which is subscribed
  // once on mount and would otherwise only ever see whatever `token` was at
  // that time.
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const persist = (nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    persist(response.user, response.token!);
    // The plaintext password only exists in this function's scope — this is
    // the one place it can be used to recover the E2EE key backup (see
    // e2ee.ts). Best-effort: a failure here shouldn't block login itself.
    recoverOrRegisterKeys(response.user.id, password, response.token!).catch(() => {});
    return response.user;
  };

  // Confirms the "reactivate my account" prompt shown after a login attempt
  // comes back ACCOUNT_DEACTIVATED_RECOVERABLE — re-verifies the password
  // server-side (see AuthService.reactivateAccount), so this can't be used to
  // reactivate an account that isn't the caller's own.
  const reactivateAccount = async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>("/auth/reactivate", {
      method: "POST",
      body: { email, password },
    });
    persist(response.user, response.token!);
    recoverOrRegisterKeys(response.user.id, password, response.token!).catch(() => {});
    return response.user;
  };

  // Logs into an existing account only — matched server-side by verified
  // Google email (see AuthService.loginWithGoogle). Never creates a user.
  const loginWithGoogle = async (idToken: string) => {
    const response = await apiRequest<AuthResponse>("/auth/google", {
      method: "POST",
      body: { idToken },
    });
    persist(response.user, response.token!);
    return response.user;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
    // Listener applications come back with no token — nothing to log in yet.
    if (response.token) {
      persist(response.user, response.token);
      recoverOrRegisterKeys(response.user.id, payload.password, response.token).catch(() => {});
    }
    return response;
  };

  // Local-only teardown — no network call. Shared by logout() (which adds
  // the network call on top) and the two automatic triggers below (a dead
  // token from any API call, or another tab logging out/switching accounts)
  // where a redundant network round-trip either can't succeed (the token's
  // already invalid) or was already made by whichever tab actually acted.
  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    clearKeys();
  };

  const logout = () => {
    // Best-effort, not awaited — logging out should feel instant regardless
    // of network conditions. Fired before clearing local state so the
    // request still carries the token (see AuthService.logout(), which takes
    // a listener offline on the way out).
    apiRequest("/auth/logout", { method: "POST", token }).catch(() => {});
    clearSession();
  };

  // A 401 from ANY API call, anywhere in the app, means THAT REQUEST's token
  // is dead — but only clear the session if it's the token we're currently
  // using. A request started before this tab's current session began (e.g.
  // a slow/retried fetch still in flight from a previous login, or from
  // before any login at all) can resolve with a 401 well after a fresh,
  // perfectly valid login — clearing unconditionally would wipe out that new
  // session for a problem that isn't even about it. Every page that matters
  // is wrapped in RequireRole, which redirects the instant isAuthenticated
  // goes false — so clearing state here is all it takes to bounce back to
  // the landing page from wherever the user currently is, once we're sure
  // it's actually THIS session that's dead.
  useEffect(() => {
    return onUnauthorized((tokenUsed) => {
      if (tokenUsed !== tokenRef.current) return;
      clearSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps every open tab in sync with whichever account is ACTUALLY logged
  // in, per the browser's own localStorage — without this, logging out (or
  // logging in as someone else) in one tab left every other already-open tab
  // running on its own stale, no-longer-current session indefinitely, still
  // able to act as whoever it thought was logged in. `storage` only fires in
  // tabs OTHER than the one that made the change, which is exactly what's
  // needed here.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) {
        clearSession();
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as { user: AuthUser; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        // Malformed value written by some other tab — ignore rather than crash.
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forgotPassword = async (email: string) => {
    const response = await apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
    return response.message;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const response = await apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    });
    return response.message;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      reactivateAccount,
      loginWithGoogle,
      register,
      logout,
      forgotPassword,
      resetPassword,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
