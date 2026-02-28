import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail, generateOrderStatusEmailHtml, isEmailConfigured } from '@/lib/email/resend'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { emailOrderStatusSchema, validateBody } from '@/lib/validation'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const STATUS_TEXT: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export async function POST(request: NextRequest) {
  // Rate limiting - strict for email endpoints
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`${ip}:/api/email/order-status`, rateLimits.strict)
  if (!rateCheck.success) {
    return rateLimitExceeded(rateCheck.resetIn)
  }
  if (!isEmailConfigured) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    // Verify authentication
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const validated = validateBody(emailOrderStatusSchema, rawBody)
    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const { profileId, status, supplierName, orderNumber, total, estimatedDelivery } = validated.data!

    // SECURITY: Verify profileId matches authenticated user
    if (user.id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user email
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(profileId)

    if (getUserError || !authUser?.user?.email) {
      return NextResponse.json({ error: 'Unable to send email' }, { status: 400 })
    }

    // Check email settings
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('email_notifications_enabled, order_updates_email')
      .eq('profile_id', profileId)
      .single()

    if (emailSettings && (!emailSettings.email_notifications_enabled || !emailSettings.order_updates_email)) {
      return NextResponse.json({ message: 'Order emails disabled' }, { status: 200 })
    }

    // Generate and send email
    const html = generateOrderStatusEmailHtml(
      {
        orderNumber,
        status,
        statusText: STATUS_TEXT[status] || status,
        supplierName,
        total,
        estimatedDelivery,
      },
      profile.business_name || 'Your business'
    )

    const result = await sendEmail({
      to: authUser.user.email,
      subject: `Order ${orderNumber}: ${STATUS_TEXT[status] || status}`,
      html,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Order status email error', { error: String(error) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
