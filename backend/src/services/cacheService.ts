import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying after 3 times
    return Math.min(times * 50, 2000);
  }
});

export class CacheService {
    /**
     * Get a value from cache
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('[CacheService] GET Error:', e);
            return null;
        }
    }

    /**
     * Set a value in cache with TTL (seconds)
     */
    static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (e) {
            console.error('[CacheService] SET Error:', e);
        }
    }

    /**
     * Delete a key (Invalidation)
     */
    static async del(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (e) {
            console.error('[CacheService] DEL Error:', e);
        }
    }

    /**
     * Pattern-based invalidation (e.g., user:*:orders)
     */
    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (e) {
            console.error('[CacheService] Pattern Invalidation Error:', e);
        }
    }
}
