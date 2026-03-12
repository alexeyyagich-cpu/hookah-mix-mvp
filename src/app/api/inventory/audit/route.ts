import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimits, rateLimitExceeded, getClientIp } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`inventory-audit:${ip}`, rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const { user, response: authResponse } = await getAuthenticatedUser()
  if (!user) return authResponse

  const params = request.nextUrl.searchParams
  const from = params.get('from') || undefined
  const to = params.get('to') || undefined
  const type = params.get('type') || undefined // 'adjustment', 'session', 'purchase', 'reversal'
  const tobaccoId = params.get('tobacco_id') || undefined
  const page = Math.max(1, parseInt(params.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '50')))
  const offset = (page - 1) * limit

  try {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('inventory_transactions')
      .select(
        'id, type, quantity_grams, notes, session_id, created_at, tobacco_inventory:tobacco_inventory_id(id, brand, flavor)',
        { count: 'exact' }
      )
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)
    const validTypes = ['purchase', 'session', 'waste', 'adjustment'] as const
    if (type && (validTypes as readonly string[]).includes(type)) {
      query = query.eq('type', type as typeof validTypes[number])
    }
    if (tobaccoId) query = query.eq('tobacco_inventory_id', tobaccoId)

    const { data, count, error } = await query

    if (error) {
      logger.error('Inventory audit query failed', { error: String(error), userId: user.id })
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    // Enrich with tobacco info
    const transactions = (data || []).map(t => {
      const tobacco = t.tobacco_inventory as unknown as { id: string; brand: string; flavor: string } | null
      return {
        id: t.id,
        type: t.type,
        quantity_grams: t.quantity_grams,
        notes: t.notes,
        session_id: t.session_id,
        created_at: t.created_at,
        brand: tobacco?.brand || null,
        flavor: tobacco?.flavor || null,
      }
    })

    // Summary stats for the filtered set
    let summaryQuery = supabase
      .from('inventory_transactions')
      .select('type, quantity_grams')
      .eq('profile_id', user.id)

    if (from) summaryQuery = summaryQuery.gte('created_at', from)
    if (to) summaryQuery = summaryQuery.lte('created_at', to)
    if (tobaccoId) summaryQuery = summaryQuery.eq('tobacco_inventory_id', tobaccoId)

    const { data: summaryData } = await summaryQuery.limit(5000)

    const summary = {
      total_adjustments: 0,
      total_sessions: 0,
      total_purchases: 0,
      total_waste: 0,
      net_grams: 0,
    }

    for (const row of summaryData || []) {
      summary.net_grams += row.quantity_grams
      switch (row.type) {
        case 'adjustment': summary.total_adjustments++; break
        case 'session': summary.total_sessions++; break
        case 'purchase': summary.total_purchases++; break
        case 'waste': summary.total_waste++; break
      }
    }

    return NextResponse.json({
      transactions,
      summary,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (err) {
    logger.error('Inventory audit failed', { userId: user.id, error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
