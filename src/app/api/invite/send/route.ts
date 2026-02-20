import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendApiKey = process.env.RESEND_API_KEY
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hookahtorus.com'

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { email, role, organizationId } = await req.json()

    if (!email || !role || !organizationId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the authenticated user owns this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('profile_id', user.id)
      .single()

    if (!membership || (membership.role !== 'owner' && membership.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Load org name and invite token
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    const { data: invite } = await supabase
      .from('invite_tokens')
      .select('token')
      .eq('organization_id', organizationId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!invite?.token) {
      return NextResponse.json({ error: 'No invite found' }, { status: 404 })
    }

    const joinUrl = `${baseUrl}/join/${invite.token}`
    const orgName = org?.name || 'a venue'

    // Send email via Resend
    if (resendApiKey) {
      const roleLabels: Record<string, string> = {
        manager: 'Manager',
        hookah_master: 'Hookah Master',
        bartender: 'Bartender',
        cook: 'Cook',
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Hookah Torus <noreply@hookahtorus.com>',
          to: email,
          subject: `You're invited to join ${orgName} on Hookah Torus`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2>You've been invited!</h2>
              <p><strong>${orgName}</strong> has invited you to join their team as <strong>${roleLabels[role] || role}</strong>.</p>
              <p style="margin: 24px 0;">
                <a href="${joinUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
                  Accept Invitation
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">Hookah Torus — Smart venue management</p>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invite send error:', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
