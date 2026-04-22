import { RATE_LIMIT_CONFIG } from "@/config";
import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter — suitable for single-instance dev/preview.
 * Replace with Redis (Upstash) for production multi-instance deployments.
 *
 * TODO: swap store for `@upstash/ratelimit` + `@upstash/redis`
 */
const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_CONFIG.windowMs,
    };
    store.set(key, newEntry);

    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_CONFIG.maxRequests) {
    logger.warn("Rate limit exceeded", { key, count: entry.count });
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Build a composite rate limit key scoped to a tenant. */
export function buildRateLimitKey(tenantId: string, identifier: string): string {
  return `rl:${tenantId}:${identifier}`;
}
