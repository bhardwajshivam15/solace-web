const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/v1";

/** Backend returns relative paths (e.g. "/uploads/avatars/x.jpg") for uploaded files. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

/** The JWT travels as a query param here — browsers can't set a header on a WebSocket upgrade request. */
export function resolveWsUrl(path: string, token: string): string {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  return `${wsBase}${path}?token=${encodeURIComponent(token)}`;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// AuthContext subscribes to this on mount so a dead token anywhere in the
// app (a real 401 from the backend — a missing/expired/invalid JWT, see
// SecurityConfig's authenticationEntryPoint) forces an immediate logout and
// redirect, instead of just failing silently on whatever one API call hit
// it while the rest of the page still acts like everything's fine. Deliberately
// NOT fired for 403s (FORBIDDEN/ACCOUNT_SUSPENDED/etc.) — those mean "this
// token is fine, you're just not allowed to do this one thing," not "your
// session is dead."
//
// Carries the token the failing request actually used — AuthContext compares
// it against whatever token is CURRENT before clearing anything. Without
// this, a stale request still in flight from a PREVIOUS session (e.g. a
// leftover fetch made with an old/expired token, resolving after the user
// has already logged in fresh as someone else) would 401 on that old token
// and wipe out the brand-new, perfectly valid session it has nothing to do
// with — "login succeeds, then immediately bounces back" was exactly this.
type UnauthorizedListener = (tokenUsed: string | null) => void;
let unauthorizedListeners: UnauthorizedListener[] = [];

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.push(listener);
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== listener);
  };
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {};
  // Let the browser set Content-Type (with the multipart boundary) itself
  // when sending FormData — setting it manually breaks the upload.
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Is the backend running?");
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const code = data?.error?.code ?? "UNKNOWN_ERROR";
    const message = data?.error?.message ?? "Something went wrong. Please try again.";
    // Specifically UNAUTHENTICATED (SecurityConfig's authenticationEntryPoint
    // — a request that carried no/an invalid/an expired token), not any 401 —
    // a failed login attempt is also a 401 (INVALID_CREDENTIALS) but there's
    // no session to tear down in that case.
    if (code === "UNAUTHENTICATED") {
      unauthorizedListeners.forEach((listener) => listener(options.token ?? null));
    }
    throw new ApiError(response.status, code, message);
  }

  return data as T;
}
