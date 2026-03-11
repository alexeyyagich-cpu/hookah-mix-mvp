import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('api-v1', rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  return withApiKey(request, async (ctx) => {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('locations')
      .select('id, name, slug, address, phone, locale, timezone, active_modules, business_type, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  })
}
