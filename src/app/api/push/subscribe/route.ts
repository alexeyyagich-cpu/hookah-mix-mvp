import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { pushSubscribeSchema, pushUnsubscribeSchema, validateBody } from '@/lib/validation'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`push-sub:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  try {
    const auth = await getAuthenticatedUser()
    if (auth.response) return auth.response
    const { user } = auth

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = validateBody(pushSubscribeSchema, rawBody)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { subscription, profileId } = validation.data

    // SECURITY: Verify profileId matches authenticated user
    if (user.id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    await supabase
      .from('push_subscriptions')
      .upsert({
        profile_id: profileId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }, { onConflict: 'profile_id,endpoint' })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`push-unsub:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  try {
    const auth = await getAuthenticatedUser()
    if (auth.response) return auth.response
    const { user } = auth

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = validateBody(pushUnsubscribeSchema, rawBody)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { endpoint, profileId } = validation.data

    // SECURITY: Verify profileId matches authenticated user
    if (user.id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('profile_id', profileId)
      .eq('endpoint', endpoint)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
