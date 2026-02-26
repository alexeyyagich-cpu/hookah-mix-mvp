import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { sendPushToUser } from '@/lib/push/server'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`push-send:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  // Verify internal API key (timing-safe)
  const apiKey = request.headers.get('x-api-key') || ''
  const expected = process.env.INTERNAL_API_KEY || ''
  if (!expected || apiKey.length !== expected.length || !timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { profileId, title, body, tag, url } = await request.json()

    if (!profileId || !title) {
      return NextResponse.json({ error: 'Missing profileId or title' }, { status: 400 })
    }

    const sent = await sendPushToUser(profileId, { title, body, tag, url })

    return NextResponse.json({ ok: true, sent })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
