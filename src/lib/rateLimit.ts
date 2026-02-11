import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

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

  // Fallback
  return 'unknown'
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // If no entry or expired, create new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.interval,
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.interval,
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
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

    const result = checkRateLimit(identifier, config)

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
