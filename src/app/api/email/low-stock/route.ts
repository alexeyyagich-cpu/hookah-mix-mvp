import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, generateLowStockEmailHtml, isEmailConfigured } from '@/lib/email/resend'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { emailLowStockSchema, validateBody } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'

export async function POST(request: NextRequest) {
  // Rate limiting - strict for email endpoints
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`${ip}:/api/email/low-stock`, rateLimits.strict)
  if (!rateCheck.success) {
    return rateLimitExceeded(rateCheck.resetIn)
  }
  if (!isEmailConfigured) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  try {
    // Verify authentication
    const auth = await getAuthenticatedUser()
    if (auth.response) return auth.response
    const { user } = auth

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const validated = validateBody(emailLowStockSchema, rawBody)
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const { profileId, items } = validated.data!

    // SECURITY: Verify profileId matches authenticated user
    if (user.id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    // Get profile and email settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, owner_name')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user email from auth
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(profileId)

    if (getUserError || !authUser?.user?.email) {
      return NextResponse.json({ error: 'Unable to send email' }, { status: 400 })
    }

    // Check email settings
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('email_notifications_enabled, low_stock_email')
      .eq('profile_id', profileId)
      .single()

    if (emailSettings && (!emailSettings.email_notifications_enabled || !emailSettings.low_stock_email)) {
      return NextResponse.json({ message: 'Low stock emails disabled' }, { status: 204 })
    }

    // Generate and send email
    const html = generateLowStockEmailHtml(items, profile.business_name || 'Your business')
    const result = await sendEmail({
      to: authUser.user.email,
      subject: `Low tobacco stock (${items.length} items)`,
      html,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Also send push notification (best-effort)
    if (isPushConfigured) {
      try {
        const count = items.length
        const pushBody = items
          .slice(0, 3)
          .map((i: { brand: string; flavor: string; quantity: number }) => `${i.brand} ${i.flavor}: ${i.quantity}g`)
          .join('\n') + (count > 3 ? `\n...and ${count - 3} more` : '')

        await sendPushToUser(profileId, {
          title: `Low stock: ${count} ${count === 1 ? 'item' : 'items'}`,
          body: pushBody,
          tag: 'low-stock',
          url: '/inventory',
          requireInteraction: true,
        })
      } catch (pushError) {
        logger.error('Push notification failed', { error: String(pushError) })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Low stock email error', { error: String(error) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
