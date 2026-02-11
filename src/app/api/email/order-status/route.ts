import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, generateOrderStatusEmailHtml, isEmailConfigured } from '@/lib/email/resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const STATUS_TEXT: Record<string, string> = {
  pending: 'Ожидает обработки',
  confirmed: 'Подтверждён',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export async function POST(request: NextRequest) {
  if (!isEmailConfigured) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { profileId, orderId, status, supplierName, orderNumber, total, estimatedDelivery } = body

    if (!profileId || !orderId || !status) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
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
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileId)

    if (authError || !authUser?.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
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
      profile.business_name || 'Ваше заведение'
    )

    const result = await sendEmail({
      to: authUser.user.email,
      subject: `Заказ ${orderNumber}: ${STATUS_TEXT[status] || status}`,
      html,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order status email error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
