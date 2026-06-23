import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let client: Redis | null = null;

if (env.REDIS_URL) {
  client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false });
  client.on('error', (err: Error) => {
    // Don't crash the API if Redis is down — cache simply degrades to misses.
    // eslint-disable-next-line no-console
    console.warn('[cache] Redis error:', err.message);
  });
}

export const cacheEnabled = (): boolean => client !== null;

export type CacheLogger = (event: 'hit' | 'miss', key: string) => void;

/**
 * Cache-aside: return the cached value for `key`, or run `producer`, cache it
 * for `ttlSeconds`, and return it. No-ops (just runs producer) when Redis is off.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
  log?: CacheLogger,
): Promise<T> {
  if (!client) return producer();

  try {
    const hit = await client.get(key);
    if (hit !== null) {
      log?.('hit', key);
      return JSON.parse(hit) as T;
    }
  } catch {
    // fall through to producer on any read error
  }

  const value = await producer();
  log?.('miss', key);
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore write errors
  }
  return value;
}

/** Invalidate keys by prefix — used when catalog data changes (future admin writes). */
export async function cacheInvalidate(prefix: string): Promise<void> {
  if (!client) return;
  const keys = await client.keys(`${prefix}*`);
  if (keys.length) await client.del(keys);
}
