import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_LEGAL_VERSION } from '@/lib/consent'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { consentType, granted = true, version = CURRENT_LEGAL_VERSION } = body

  if (!['terms', 'privacy', 'widerruf_waiver', 'cookie'].includes(consentType)) {
    return NextResponse.json({ error: 'Invalid consent type' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)('consent_log').insert({
    profile_id: user.id,
    consent_type: consentType,
    version,
    granted,
    ip_address: ip,
    user_agent: request.headers.get('user-agent'),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
