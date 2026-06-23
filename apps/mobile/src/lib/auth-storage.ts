import type { PublicUser } from '@quickbasket/types';
import { storage } from './storage';

const KEYS = {
  access: 'qb.accessToken',
  refresh: 'qb.refreshToken',
  user: 'qb.user',
} as const;

export interface StoredAuth {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  await Promise.all([
    storage.setItem(KEYS.access, auth.accessToken),
    storage.setItem(KEYS.refresh, auth.refreshToken),
    storage.setItem(KEYS.user, JSON.stringify(auth.user)),
  ]);
}

/** Update only the tokens (used after a silent refresh). */
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    storage.setItem(KEYS.access, accessToken),
    storage.setItem(KEYS.refresh, refreshToken),
  ]);
}

export async function loadAuth(): Promise<StoredAuth | null> {
  const [accessToken, refreshToken, userStr] = await Promise.all([
    storage.getItem(KEYS.access),
    storage.getItem(KEYS.refresh),
    storage.getItem(KEYS.user),
  ]);
  if (!accessToken || !refreshToken || !userStr) return null;
  try {
    return { accessToken, refreshToken, user: JSON.parse(userStr) as PublicUser };
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    storage.removeItem(KEYS.access),
    storage.removeItem(KEYS.refresh),
    storage.removeItem(KEYS.user),
  ]);
}
