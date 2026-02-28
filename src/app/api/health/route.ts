import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()

  let db = false
  let redis = false

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

  const latency_ms = Date.now() - start
  const status = db && redis ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    db,
    redis,
    latency_ms,
    timestamp: new Date().toISOString(),
  })
}
