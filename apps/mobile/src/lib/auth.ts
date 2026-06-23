import type { AuthResponse, LoginDto, RegisterDto } from '@quickbasket/types';
import { logout as logoutAction, setCredentials } from '@quickbasket/store';
import { store } from '@/store';
import { apiFetch } from './api';
import { clearAuth, saveAuth } from './auth-storage';

export async function login(dto: LoginDto): Promise<void> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: dto,
    auth: false,
  });
  store.dispatch(setCredentials(res));
  await saveAuth(res);
}

export async function register(dto: RegisterDto): Promise<void> {
  const res = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: dto,
    auth: false,
  });
  store.dispatch(setCredentials(res));
  await saveAuth(res);
}

export async function logout(): Promise<void> {
  const refreshToken = store.getState().auth.refreshToken;
  try {
    if (refreshToken) {
      await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false });
    }
  } catch {
    // best-effort server revocation; clear locally regardless
  }
  store.dispatch(logoutAction());
  await clearAuth();
}
