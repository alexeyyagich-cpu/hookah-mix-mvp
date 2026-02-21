import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push/server'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`push-send:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  // Verify internal API key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.INTERNAL_API_KEY) {
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
