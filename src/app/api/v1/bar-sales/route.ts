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
    const since = searchParams.get('since')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('bar_sales')
      .select('id, recipe_name, quantity, unit_price, total_revenue, total_cost, margin_percent, sold_at, location_id, guest_name, notes')
      .eq('organization_id', ctx.organizationId)
      .order('sold_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }
    if (since) {
      query = query.gte('sold_at', since)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bar sales' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      meta: { total: count, limit, offset },
    })
  })
}
