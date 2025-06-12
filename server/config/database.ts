import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

// In-memory store as fallback when Redis is not available
class InMemoryStore {
  private store = new Map<string, string>();
  private expiry = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    // Check if key has expired
    const expiryTime = this.expiry.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.store.delete(key);
      this.expiry.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    this.store.set(key, value);
    if (options?.EX) {
      this.expiry.set(key, Date.now() + (options.EX * 1000));
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.expiry.delete(key);
  }

  async exists(key: string): Promise<number> {
    // Check if key has expired
    const expiryTime = this.expiry.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.store.delete(key);
      this.expiry.delete(key);
      return 0;
    }
    return this.store.has(key) ? 1 : 0;
  }

  async flushAll(): Promise<void> {
    this.store.clear();
    this.expiry.clear();
  }

  // Mock methods for Redis client compatibility
  async quit(): Promise<void> {
    // No-op for in-memory store
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

let redisClient: any;
let isRedisAvailable = false;

export async function initializeRedis() {
  try {
    // Try to connect to Redis
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000, // 2 second timeout
        lazyConnect: true
      }
    });

    client.on('error', (err) => {
      logger.warn('Redis Client Error', err.message);
      isRedisAvailable = false;
    });

    client.on('connect', () => {
      logger.info('Connected to Redis');
      isRedisAvailable = true;
    });

    client.on('disconnect', () => {
      logger.warn('Disconnected from Redis, falling back to in-memory store');
      isRedisAvailable = false;
    });

    // Attempt to connect
    await client.connect();
    await client.ping();
    
    redisClient = client;
    isRedisAvailable = true;
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.warn('Failed to connect to Redis, using in-memory store as fallback:', error instanceof Error ? error.message : 'Unknown error');
    redisClient = new InMemoryStore();
    isRedisAvailable = false;
  }
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

export function isRedisConnected() {
  return isRedisAvailable;
}

// Graceful shutdown
export async function closeRedis() {
  if (redisClient && isRedisAvailable) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}