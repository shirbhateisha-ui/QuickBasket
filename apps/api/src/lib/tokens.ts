import { randomBytes, createHash } from 'node:crypto';

/** Opaque refresh token handed to the client (not a JWT). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

/** Only the hash is stored server-side, so a DB leak can't be replayed. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
