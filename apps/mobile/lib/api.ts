import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

/** Refresh a bit before the token actually expires to avoid edge-of-expiry 401s. */
const TOKEN_EXPIRY_MARGIN_S = 60;

/**
 * Return a currently-valid access token, refreshing the session first if it's
 * missing or about to expire. The web API validates this bearer token, so a
 * stale token here surfaces to the user as a confusing "Unauthorized" on
 * actions like sending a wave or opening a chat.
 */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const expiresAt = session.expires_at ?? 0;
  const nowS = Math.floor(Date.now() / 1000);
  if (expiresAt && expiresAt - nowS <= TOKEN_EXPIRY_MARGIN_S) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) return refreshed.session.access_token;
  }
  return session.access_token ?? null;
}

async function getAuthHeaders(token: string | null): Promise<Record<string, string>> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = await getAccessToken();
  const headers = await getAuthHeaders(token);
  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  // A 401 usually means the token we sent had just expired (background timers in
  // React Native are unreliable). Force a refresh once and retry before giving up.
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    token = refreshed.session?.access_token ?? null;
    if (token) {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...(await getAuthHeaders(token)), ...options.headers },
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || 'Request failed', body.details);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
