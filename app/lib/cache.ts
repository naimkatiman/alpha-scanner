interface CacheEntry { value: unknown; expiresAt: number; }
const mem = new Map<string, CacheEntry>();
setInterval(() => { const now = Date.now(); for (const [k, e] of mem) { if (e.expiresAt < now) mem.delete(k); } }, 60000);
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try { const { Redis } = await import("@upstash/redis"); return await new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }).get<T>(key); } catch { /* */ }
    }
    const e = mem.get(key); if (!e) return null; if (e.expiresAt < Date.now()) { mem.delete(key); return null; } return e.value as T;
  },
  async set(key: string, value: unknown, ttl: number = 60): Promise<void> {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try { const { Redis } = await import("@upstash/redis"); await new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! }).set(key, value, { ex: ttl }); return; } catch { /* */ }
    }
    mem.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  },
  async del(key: string): Promise<void> { mem.delete(key); },
};
