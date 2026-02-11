import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, generateLowStockEmailHtml, isEmailConfigured } from '@/lib/email/resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  if (!isEmailConfigured) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { profileId, items } = body

    if (!profileId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileId)

    if (authError || !authUser?.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Check email settings
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('email_notifications_enabled, low_stock_email')
      .eq('profile_id', profileId)
      .single()

    if (emailSettings && (!emailSettings.email_notifications_enabled || !emailSettings.low_stock_email)) {
      return NextResponse.json({ message: 'Low stock emails disabled' }, { status: 200 })
    }

    // Generate and send email
    const html = generateLowStockEmailHtml(items, profile.business_name || 'Ваше заведение')
    const result = await sendEmail({
      to: authUser.user.email,
      subject: `Низкий запас табака (${items.length} позиций)`,
      html,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Low stock email error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
