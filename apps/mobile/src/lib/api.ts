import { logout as logoutAction, setTokens } from '@quickbasket/store';
import { store } from '@/store';
import { clearAuth, saveTokens } from './auth-storage';

// Override per environment, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RawResult {
  res: Response;
  body: any;
}

async function raw(path: string, init: RequestInit): Promise<RawResult> {
  const res = await fetch(`${API_URL}${path}`, init);
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { res, body };
}

/** Try to rotate tokens with the stored refresh token. Logs out on failure. */
async function refreshTokens(): Promise<boolean> {
  const refreshToken = store.getState().auth.refreshToken;
  if (!refreshToken) return false;
  const { res, body } = await raw('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok || !body?.accessToken) {
    store.dispatch(logoutAction());
    await clearAuth();
    return false;
  }
  store.dispatch(setTokens({ accessToken: body.accessToken, refreshToken: body.refreshToken }));
  await saveTokens(body.accessToken, body.refreshToken);
  return true;
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set false for public endpoints (login/register) so no auth header / refresh. */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const useAuth = options.auth !== false;

  const doFetch = () => {
    const token = store.getState().auth.accessToken;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (useAuth && token) headers.Authorization = `Bearer ${token}`;
    return raw(path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let { res, body } = await doFetch();

  // On 401 for an authed request, attempt one silent refresh + retry.
  if (res.status === 401 && useAuth) {
    const refreshed = await refreshTokens();
    if (refreshed) ({ res, body } = await doFetch());
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'ERROR',
      body?.error?.message ?? 'Something went wrong',
    );
  }
  return body as T;
}
