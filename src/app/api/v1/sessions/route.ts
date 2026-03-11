import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('api-v1', rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  return withApiKey(request, async (ctx) => {
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const since = searchParams.get('since') // ISO date string
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('sessions')
      .select('id, session_date, total_grams, selling_price, rating, notes, guest_id, location_id, created_at, session_items(tobacco_id, brand, flavor, grams_used)')
      .eq('organization_id', ctx.organizationId)
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }
    if (since) {
      query = query.gte('session_date', since)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      meta: { total: count, limit, offset },
    })
  })
}
