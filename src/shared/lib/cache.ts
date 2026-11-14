import { redis } from "@/shared/lib/redis";

/**
 * Cache-aside helper. Returns cached value when present, otherwise calls
 * `fn`, stores the JSON result for `ttlSeconds` and returns it.
 * Failures of the cache backend never break the request.
 */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    /* ignore cache read errors */
  }

  const value = await fn();

  try {
    await redis.set(key, JSON.stringify(value), ttlSeconds);
  } catch {
    /* ignore cache write errors */
  }

  return value;
}

/** Invalidate all keys starting with the given prefix. */
export async function invalidatePrefix(prefix: string): Promise<void> {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    /* ignore */
  }
}
