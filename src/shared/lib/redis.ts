"use strict";

// In-memory Redis stub used when a real Redis instance is not configured.
// Methods are safe no-ops so the application compiles and works without
// Redis. Replace with an ioredis client when Redis is provisioned.

const store = new Map<string, string>();

export const redis = {
  async get(key: string): Promise<string | null> {
    return store.get(key) ?? null;
  },
  async set(key: string, value: string, ..._rest: any[]): Promise<string | null> {
    store.set(key, value);
    return "OK";
  },
  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (store.delete(key)) deleted += 1;
    }
    return deleted;
  },
  async incr(key: string): Promise<number> {
    const current = parseInt(store.get(key) || "0", 10) || 0;
    const next = current + 1;
    store.set(key, String(next));
    return next;
  },
  async expire(_key: string, _ttl: number): Promise<number> {
    return 1;
  },
  async keys(_pattern: string): Promise<string[]> {
    return Array.from(store.keys());
  },
  async smembers(_key: string): Promise<string[]> {
    return [];
  },
  async lpush(_key: string, ..._values: string[]): Promise<number> {
    return 0;
  },
  async lrange(_key: string, _start: number, _stop: number): Promise<string[]> {
    return [];
  },
  async pipeline(): Promise<any> {
    return {
      get: () => this,
      set: () => this,
      del: () => this,
      lpush: () => this,
      lrange: () => this,
      exec: async (): Promise<any[]> => [],
    };
  },
};
