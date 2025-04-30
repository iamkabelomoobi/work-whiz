import { redis } from '@work-whiz/libs';

/**
 * Utility class for interacting with Redis cache.
 * Supports basic operations and pattern-based deletions.
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
   * @returns {Promise<any | null>} Parsed object or string if exists, otherwise null
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async get(key: string): Promise<any | null> {
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
   * Deletes all keys matching a pattern using Redis SCAN + DEL
   * @param {string} pattern - The pattern to match (e.g., 'prefix:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  public async deletePattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const reply = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);

      cursor = reply[0];
      const keys = reply[1];

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    return deletedCount;
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

  /**
   * Gets the time-to-live (TTL) for a key in seconds.
   * @param {string} key - The cache key
   * @returns {Promise<number>} TTL in seconds (-2 if key doesn't exist, -1 if no expiry)
   */
  public async ttl(key: string): Promise<number> {
    return await redis.ttl(key);
  }
}

export const cacheUtil = CacheUtil.getInstance();
