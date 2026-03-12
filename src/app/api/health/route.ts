import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
  const start = Date.now()

  let db = false
  let redis = false
  let stripe = false

  // Check Supabase connectivity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: { apikey: supabaseKey },
        signal: AbortSignal.timeout(3000),
      })
      db = res.ok || res.status === 400 // 400 means API is reachable
    } catch {
      db = false
    }
  }

  // Check Redis connectivity (Upstash)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(3000),
      })
      redis = res.ok
    } catch {
      redis = false
    }
  } else {
    redis = true // No Redis configured = skip check
  }

  // Check Stripe connectivity
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (stripeKey) {
    try {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${stripeKey}` },
        signal: AbortSignal.timeout(3000),
      })
      stripe = res.ok
    } catch {
      stripe = false
    }
  } else {
    stripe = true // No Stripe configured = skip check
  }

  const latency_ms = Date.now() - start
  const allUp = db && redis && stripe
  const status = allUp ? 'ok' : 'degraded'

  if (!allUp) {
    logger.warn('Health check degraded', { db, redis, stripe, latency_ms })
  }

  return NextResponse.json({
    status,
    services: { db, redis, stripe },
    latency_ms,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    timestamp: new Date().toISOString(),
  })
}
