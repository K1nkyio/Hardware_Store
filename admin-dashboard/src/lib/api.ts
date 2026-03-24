const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
const ADMIN_AUTH_BASE_PATH = "/api/admin/auth";
const ADMIN_SESSION_HINT_KEY = "admin_session_hint";
let adminAccessToken = "";
let refreshPromise: Promise<boolean> | null = null;

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message) return data.message;
  } catch {
    // Ignore parse errors and fallback to status text.
  }

  return response.statusText || "Request failed";
}

export type AuthRole = "customer" | "viewer" | "manager" | "super_admin";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: AuthRole;
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn?: number;
  mfaSetupRequired?: boolean;
}

export interface AdminMfaSetupResponse {
  secret: string;
  otpauthUri: string;
  backupCodes: string[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function markAdminSessionHint(present: boolean): void {
  if (!isBrowser()) return;
  if (present) {
    window.localStorage.setItem(ADMIN_SESSION_HINT_KEY, "1");
    return;
  }
  window.localStorage.removeItem(ADMIN_SESSION_HINT_KEY);
}

function hasAdminSessionHint(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(ADMIN_SESSION_HINT_KEY) === "1";
}

function isAdminRole(role: string): role is "viewer" | "manager" | "super_admin" {
  return role === "viewer" || role === "manager" || role === "super_admin";
}

export function getAdminAccessToken(): string {
  return adminAccessToken;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isAdminMfaPendingToken(token = getAdminAccessToken()): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return payload?.mfa === "pending";
}

export function getAdminRefreshToken(): string {
  return "";
}

export function setAdminSession(session: AuthSession): void {
  adminAccessToken = session.accessToken;
  markAdminSessionHint(true);
}

export function clearAdminSession(): void {
  adminAccessToken = "";
  markAdminSessionHint(false);
}

function isAdminAuthPath(path: string): boolean {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      return new URL(path).pathname.startsWith(`${ADMIN_AUTH_BASE_PATH}/`);
    } catch {
      return false;
    }
  }
  return path.startsWith(`${ADMIN_AUTH_BASE_PATH}/`);
}

function redirectToLogin(): void {
  if (!isBrowser()) return;
  if (window.location.pathname === "/admin/login") return;
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const nextParam = encodeURIComponent(next);
  window.location.assign(`/admin/login?next=${nextParam}`);
}

async function refreshAdminAccessToken(): Promise<boolean> {
  if (!isBrowser()) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildApiUrl(`${ADMIN_AUTH_BASE_PATH}/refresh`), {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) return false;

      const payload = (await response.json()) as { user?: AuthUser; accessToken?: string };
      if (!payload.accessToken) return false;

      adminAccessToken = payload.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function restoreAdminSession(): Promise<boolean> {
  if (getAdminAccessToken()) return true;
  if (!hasAdminSessionHint()) return false;
  return refreshAdminAccessToken();
}

async function apiRequestInternal<T>(path: string, init: RequestInit = {}, allowAuthRetry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getAdminAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && allowAuthRetry && !isAdminAuthPath(path)) {
    const refreshed = await refreshAdminAccessToken();
    if (refreshed) {
      return apiRequestInternal<T>(path, init, false);
    }

    clearAdminSession();
    redirectToLogin();
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiRequestInternal<T>(path, init, true);
}

export function resolveAssetUrl(value?: string): string {
  if (!value) return "";
  return buildApiUrl(value);
}

export async function loginAdmin(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>(`${ADMIN_AUTH_BASE_PATH}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!isAdminRole(session.user.role)) {
    throw new Error("This account does not have admin dashboard access");
  }

  setAdminSession(session);
  return session;
}

export async function seedAdmin(
  payload: Pick<AuthUser, "email" | "username" | "fullName"> & { password: string }
): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>(`${ADMIN_AUTH_BASE_PATH}/seed-super-admin`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAdminSession(session);
  return session;
}

export async function registerAdminSelf(
  payload: Pick<AuthUser, "email" | "username"> & { password: string; fullName?: string }
): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>(`${ADMIN_AUTH_BASE_PATH}/self-register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!isAdminRole(session.user.role)) {
    throw new Error("This account does not have admin dashboard access");
  }

  setAdminSession(session);
  return session;
}

export async function requestAdminPasswordReset(
  email: string
): Promise<{ ok: boolean; resetToken?: string }> {
  return apiRequest<{ ok: boolean; resetToken?: string }>(`${ADMIN_AUTH_BASE_PATH}/request-password-reset`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function logoutAdmin(allSessions = false): Promise<void> {
  await apiRequest<void>(`${ADMIN_AUTH_BASE_PATH}/logout`, {
    method: "POST",
    body: JSON.stringify({
      allSessions,
    }),
  });
  clearAdminSession();
}

export async function getAdminProfile(): Promise<{ user: AuthUser; source: string }> {
  return apiRequest<{ user: AuthUser; source: string }>(`${ADMIN_AUTH_BASE_PATH}/me`);
}

export async function setupAdminMfa(): Promise<AdminMfaSetupResponse> {
  return apiRequest<AdminMfaSetupResponse>(`${ADMIN_AUTH_BASE_PATH}/mfa/setup`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function activateAdminMfa(code: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>(`${ADMIN_AUTH_BASE_PATH}/mfa/activate`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  setAdminSession(session);
  return session;
}
