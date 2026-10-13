import Redis from 'ioredis';
import { logger } from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 3) {
      logger.info('Redis unavailable locally — switched to fast in-memory fallback stores');
      return null;
    }
    return Math.min(times * 150, 1000);
  },
  lazyConnect: true
});

let isConnected = false;

redis.on('connect', () => {
  isConnected = true;
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  isConnected = false;
  logger.warn({ err: err.message }, 'Redis connection warning (running with fallback if unavailable)');
});

// Attempt connection on startup, but do not crash if Redis is unavailable locally
redis.connect().catch((err) => {
  logger.warn({ err: err.message }, 'Initial Redis connection could not be established');
});

// In-memory fallback map for environments where Redis is temporarily offline
const memoryBlacklist = new Map();

/**
 * Blacklist a token JTI until its expiration
 * @param {string} jti
 * @param {number} expSeconds remaining seconds until token expires
 */
export async function blacklistToken(jti, expSeconds) {
  const ttl = Math.max(Math.floor(expSeconds), 1);
  try {
    if (isConnected || redis.status === 'ready' || redis.status === 'connecting') {
      await redis.set(`bl:${jti}`, '1', 'EX', ttl);
      return;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to write token blacklist to Redis, using memory store');
  }

  // Memory fallback
  memoryBlacklist.set(jti, Date.now() + ttl * 1000);
}

/**
 * Check if a token JTI is blacklisted
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
export async function isTokenBlacklisted(jti) {
  try {
    if (isConnected || redis.status === 'ready' || redis.status === 'connecting') {
      const result = await redis.get(`bl:${jti}`);
      if (result) return true;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to check token blacklist in Redis, checking memory store');
  }

  const expiry = memoryBlacklist.get(jti);
  if (expiry) {
    if (Date.now() > expiry) {
      memoryBlacklist.delete(jti);
      return false;
    }
    return true;
  }
  return false;
}

// In-memory fallback for sliding window rate limiting
const memoryRateLimits = new Map();

/**
 * Sliding window rate limiter using Redis sorted sets (with memory fallback)
 * @param {string} key Rate limit identifier
 * @param {number} limit Maximum requests allowed in window
 * @param {number} windowSeconds Time window in seconds
 * @returns {Promise<{ allowed: boolean, count: number, remaining: number }>}
 */
export async function checkSlidingWindowRateLimit(key, limit = 30, windowSeconds = 60) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const clearBefore = now - windowMs;

  try {
    if (isConnected || redis.status === 'ready' || redis.status === 'connecting') {
      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, clearBefore);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, windowSeconds + 2);

      const results = await multi.exec();
      const count = results[2][1];
      const allowed = count <= limit;

      return {
        allowed,
        count,
        remaining: Math.max(0, limit - count)
      };
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Redis rate limit error, using memory fallback');
  }

  // Fallback memory rate limiter
  let timestamps = memoryRateLimits.get(key) || [];
  timestamps = timestamps.filter((ts) => ts > clearBefore);
  timestamps.push(now);
  memoryRateLimits.set(key, timestamps);

  const count = timestamps.length;
  const allowed = count <= limit;

  return {
    allowed,
    count,
    remaining: Math.max(0, limit - count)
  };
}
