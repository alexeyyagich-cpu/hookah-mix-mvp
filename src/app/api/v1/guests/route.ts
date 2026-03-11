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
    const tier = searchParams.get('tier') // bronze, silver, gold
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('guests')
      .select('id, name, phone, visit_count, total_spent, loyalty_tier, bonus_balance, last_visit_at, notes, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('last_visit_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (tier && ['bronze', 'silver', 'gold'].includes(tier)) {
      query = query.eq('loyalty_tier', tier as 'bronze' | 'silver' | 'gold')
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      meta: { total: count, limit, offset },
    })
  })
}
