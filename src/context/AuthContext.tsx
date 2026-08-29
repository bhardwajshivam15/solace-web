import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "../lib/apiClient";
import { clearKeys } from "../lib/e2ee";

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
    }
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    clearKeys();
  };

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
