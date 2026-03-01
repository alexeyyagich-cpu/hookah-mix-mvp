import { NextRequest, NextResponse } from 'next/server'
import { generateConnectLink, isTelegramConfigured } from '@/lib/telegram/bot'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'

export async function GET(request: NextRequest) {
  if (!isTelegramConfigured) {
    return NextResponse.json({ configured: false, link: '' })
  }

  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`tg-link:${ip}`, rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const auth = await getAuthenticatedUser()
  if (!auth.user) {
    return NextResponse.json({ configured: true, link: '' }, { status: 401 })
  }

  const link = generateConnectLink(auth.user.id)
  return NextResponse.json({ configured: true, link })
}
