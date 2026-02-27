import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

// Lazy-initialized Redis client (null if env vars not set)
let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

// Cache of Ratelimit instances keyed by config fingerprint
const limiters = new Map<string, Ratelimit>()

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const key = `${config.maxRequests}:${config.interval}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.fixedWindow(config.maxRequests, `${config.interval} ms`),
      prefix: 'rl',
    })
    limiters.set(key, limiter)
  }
  return limiter
}

export function getClientIp(request: NextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback: include user-agent prefix to reduce bucket collision
  // when multiple clients lack IP headers (rare on Vercel where x-forwarded-for is always set)
  return 'anon-' + (request.headers.get('user-agent')?.slice(0, 50) || 'no-ua')
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetIn: number }> {
  const limiter = getRateLimiter(config)

  // If Redis not configured, fail open
  if (!limiter) {
    return { success: true, remaining: config.maxRequests, resetIn: 0 }
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      remaining: result.remaining,
      resetIn: Math.max(0, result.reset - Date.now()),
    }
  } catch {
    // Redis error: fail open
    return { success: true, remaining: config.maxRequests, resetIn: 0 }
  }
}

// Pre-configured rate limiters
export const rateLimits = {
  // Strict: 10 requests per minute (for sensitive operations)
  strict: { interval: 60000, maxRequests: 10 },
  // Standard: 30 requests per minute
  standard: { interval: 60000, maxRequests: 30 },
  // Relaxed: 100 requests per minute
  relaxed: { interval: 60000, maxRequests: 100 },
  // Webhook: 1000 requests per minute (for external services)
  webhook: { interval: 60000, maxRequests: 1000 },
}

// Helper to create rate-limited response
export function rateLimitExceeded(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(resetIn / 1000).toString(),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

// Middleware wrapper for rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = rateLimits.standard
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = getClientIp(request)
    const path = request.nextUrl.pathname
    const identifier = `${ip}:${path}`

    const result = await checkRateLimit(identifier, config)

    if (!result.success) {
      return rateLimitExceeded(result.resetIn)
    }

    const response = await handler(request)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString())

    return response
  }
}
