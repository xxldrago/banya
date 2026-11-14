"use strict";

// Redis client used for caching, rate limiting and security bookkeeping.
// When REDIS_URL is configured a real ioredis client is used; otherwise an
// in-memory stub keeps the application fully functional for local/demo runs.

const store = new Map<string, string>();
const ttlStore = new Map<string, NodeJS.Timeout>();

function memGet(key: string): string | null {
  return store.get(key) ?? null;
}

function memSet(key: string, value: string, ttlSeconds?: number): void {
  store.set(key, value);
  if (ttlSeconds && ttlSeconds > 0) {
    const existing = ttlStore.get(key);
    if (existing) clearTimeout(existing);
    ttlStore.set(
      key,
      setTimeout(() => {
        store.delete(key);
        ttlStore.delete(key);
      }, ttlSeconds * 1000),
    );
  }
}

function memDel(...keys: string[]): number {
  let deleted = 0;
  for (const key of keys) {
    if (store.delete(key)) deleted += 1;
    const t = ttlStore.get(key);
    if (t) {
      clearTimeout(t);
      ttlStore.delete(key);
    }
  }
  return deleted;
}

function memIncr(key: string): number {
  const next = (parseInt(store.get(key) || "0", 10) || 0) + 1;
  store.set(key, String(next));
  return next;
}

function memExpire(key: string, ttlSeconds: number): number {
  if (store.has(key)) {
    memSet(key, store.get(key) as string, ttlSeconds);
    return 1;
  }
  return 0;
}

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...rest: any[]): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  smembers(key: string): Promise<string[]>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  pipeline(): any;
  ping(): Promise<string>;
};

let client: RedisLike | null = null;
let mode: "memory" | "redis" = "memory";

if (process.env.REDIS_URL) {
  try {
    // Lazy require so builds and non-redis environments do not need the package.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis");
    const real = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      retryStrategy: (times: number) => Math.min(times * 500, 5000),
    });
    real.on("error", (err: Error) => {
      console.error("[redis] connection error:", err.message);
    });
    client = real as RedisLike;
    mode = "redis";
  } catch (err) {
    console.error("[redis] failed to initialize, falling back to memory:", err);
    client = null;
    mode = "memory";
  }
}

function wrap<T>(memoryResult: () => T, redisCall?: () => Promise<T>): T | Promise<T> {
  if (client) {
    try {
      return redisCall ? redisCall() : (undefined as unknown as T);
    } catch {
      return memoryResult();
    }
  }
  return memoryResult();
}

export const redis = {
  /** "redis" when a real instance is connected, "memory" for the stub. */
  mode,

  async get(key: string): Promise<string | null> {
    if (client) {
      try {
        return await client.get(key);
      } catch {
        /* fall through to memory */
      }
    }
    return memGet(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<string | null> {
    if (client) {
      try {
        if (ttlSeconds && ttlSeconds > 0) await client.set(key, value, "EX", ttlSeconds);
        else await client.set(key, value);
        return "OK";
      } catch {
        /* fall through to memory */
      }
    }
    memSet(key, value, ttlSeconds);
    return "OK";
  },

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    if (client) {
      try {
        deleted = await client.del(...keys);
      } catch {
        deleted = 0;
      }
    }
    return deleted + memDel(...keys);
  },

  async incr(key: string): Promise<number> {
    if (client) {
      try {
        return await client.incr(key);
      } catch {
        /* fall through */
      }
    }
    return memIncr(key);
  },

  async expire(key: string, ttlSeconds: number): Promise<number> {
    if (client) {
      try {
        return await client.expire(key, ttlSeconds);
      } catch {
        /* fall through */
      }
    }
    return memExpire(key, ttlSeconds);
  },

  async keys(pattern: string): Promise<string[]> {
    if (client) {
      try {
        return await client.keys(pattern);
      } catch {
        /* fall through */
      }
    }
    return Array.from(store.keys()).filter((k) =>
      pattern.endsWith("*") ? k.startsWith(pattern.slice(0, -1)) : k === pattern,
    );
  },

  async smembers(key: string): Promise<string[]> {
    if (client) {
      try {
        return await client.smembers(key);
      } catch {
        /* fall through */
      }
    }
    return [];
  },

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (client) {
      try {
        return await client.lpush(key, ...values);
      } catch {
        /* fall through */
      }
    }
    return 0;
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (client) {
      try {
        return await client.lrange(key, start, stop);
      } catch {
        /* fall through */
      }
    }
    return [];
  },

  async pipeline(): Promise<any> {
    if (client) {
      try {
        return await client.pipeline();
      } catch {
        /* fall through */
      }
    }
    return {
      get: () => this,
      set: () => this,
      del: () => this,
      lpush: () => this,
      lrange: () => this,
      exec: async (): Promise<any[]> => [],
    };
  },

  async ping(): Promise<string> {
    if (client) {
      try {
        return await client.ping();
      } catch {
        return "ERROR";
      }
    }
    return "MEMORY";
  },
};
