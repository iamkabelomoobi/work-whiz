import { redis } from '@work-whiz/libs';

/**
 * Utility class for interacting with Redis cache.
 * Supports basic get, set, delete, and flush operations.
 */
class CacheUtil {
  private static instance: CacheUtil;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Returns a singleton instance of the CacheUtil
   * @returns {CacheUtil} Singleton instance
   */
  public static getInstance(): CacheUtil {
    if (!CacheUtil.instance) {
      CacheUtil.instance = new CacheUtil();
    }
    return CacheUtil.instance;
  }

  /**
   * Sets a key-value pair in Redis with an expiration.
   * @param {string} key - The cache key
   * @param {unknown} value - The value to store (object, string, etc.)
   * @param {number} expiration - Expiration in seconds
   */
  public async set(
    key: string,
    value: unknown,
    expiration: number,
  ): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', expiration);
  }

  /**
   * Retrieves a value from Redis by key.
   * @param {string} key - The cache key
   * @returns {Promise<unknown | null>} Parsed object or string if exists, otherwise null
   */
  public async get(key: string): Promise<unknown | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Deletes a specific key from Redis.
   * @param {string} key - The cache key
   */
  public async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  /**
   * Clears all data in the Redis database.
   */
  public async clear(): Promise<void> {
    await redis.flushdb();
  }

  /**
   * Checks if a cache key exists.
   * @param {string} key - The cache key
   * @returns {Promise<boolean>} True if the key exists, false otherwise
   */
  public async has(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  }
}

export const cacheUtil = CacheUtil.getInstance();
