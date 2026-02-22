import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function authenticateUser() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
  const { data: { user }, error } = await supabaseAuth.auth.getUser()
  if (error || !user) return null
  return user
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`push-sub:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  try {
    const user = await authenticateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription, profileId } = await request.json()

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth || !profileId) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    // SECURITY: Verify profileId matches authenticated user
    if (user.id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  try {
    const user = await authenticateUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint, profileId } = await request.json()

    if (!endpoint || !profileId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // SECURITY: Verify profileId matches authenticated user
    if (user.id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
