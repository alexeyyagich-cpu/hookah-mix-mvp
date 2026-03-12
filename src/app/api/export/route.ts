import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimits, rateLimitExceeded, getClientIp } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

type ExportType = 'inventory' | 'sessions' | 'guests' | 'bar-sales' | 'transactions'

const VALID_TYPES: ExportType[] = ['inventory', 'sessions', 'guests', 'bar-sales', 'transactions']

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`export:${ip}`, rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const { user, response: authResponse } = await getAuthenticatedUser()
  if (!user) return authResponse

  const type = request.nextUrl.searchParams.get('type') as ExportType
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Valid: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const from = request.nextUrl.searchParams.get('from') || undefined
  const to = request.nextUrl.searchParams.get('to') || undefined

  try {
    const supabase = getSupabaseAdmin()
    const csv = await generateCsv(supabase, user.id, type, from, to)

    const filename = `${type}_${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse('\ufeff' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    logger.error('Export failed', { type, userId: user.id, error: String(err) })
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

async function generateCsv(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  profileId: string,
  type: ExportType,
  from?: string,
  to?: string,
): Promise<string> {
  switch (type) {
    case 'inventory':
      return exportInventory(supabase, profileId)
    case 'sessions':
      return exportSessions(supabase, profileId, from, to)
    case 'guests':
      return exportGuests(supabase, profileId)
    case 'bar-sales':
      return exportBarSales(supabase, profileId, from, to)
    case 'transactions':
      return exportTransactions(supabase, profileId, from, to)
  }
}

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(v => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }).join(',')
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n')
}

type Supabase = ReturnType<typeof getSupabaseAdmin>

async function exportInventory(supabase: Supabase, profileId: string): Promise<string> {
  const { data } = await supabase
    .from('tobacco_inventory')
    .select('brand, flavor, quantity_grams, purchase_price, package_grams, created_at')
    .eq('profile_id', profileId)
    .order('brand')
    .limit(2000)

  const rows = (data || []).map(i => [
    i.brand, i.flavor, i.quantity_grams, i.purchase_price, i.package_grams, i.created_at,
  ])
  return toCsv(['Brand', 'Flavor', 'Remaining (g)', 'Purchase Price', 'Package (g)', 'Added'], rows)
}

async function exportSessions(supabase: Supabase, profileId: string, from?: string, to?: string): Promise<string> {
  let query = supabase
    .from('sessions')
    .select('session_date, total_grams, selling_price, compatibility_score, rating, guest_id, created_at')
    .eq('profile_id', profileId)
    .order('session_date', { ascending: false })
    .limit(5000)

  if (from) query = query.gte('session_date', from)
  if (to) query = query.lte('session_date', to)

  const { data } = await query

  const rows = (data || []).map(s => [
    s.session_date, s.total_grams, s.selling_price, s.compatibility_score, s.rating, s.guest_id, s.created_at,
  ])
  return toCsv(['Date', 'Grams', 'Price', 'Compatibility', 'Rating', 'Guest ID', 'Created'], rows)
}

async function exportGuests(supabase: Supabase, profileId: string): Promise<string> {
  const { data } = await supabase
    .from('guests')
    .select('name, phone, visit_count, last_visit_at, loyalty_tier, bonus_balance, discount_percent, notes, created_at')
    .eq('profile_id', profileId)
    .order('name')
    .limit(5000)

  const rows = (data || []).map(g => [
    g.name, g.phone, g.visit_count, g.last_visit_at, g.loyalty_tier, g.bonus_balance, g.discount_percent, g.notes, g.created_at,
  ])
  return toCsv(['Name', 'Phone', 'Visits', 'Last Visit', 'Tier', 'Bonus', 'Discount %', 'Notes', 'Created'], rows)
}

async function exportBarSales(supabase: Supabase, profileId: string, from?: string, to?: string): Promise<string> {
  let query = supabase
    .from('bar_sales')
    .select('recipe_name, quantity, unit_price, total_revenue, total_cost, sold_at')
    .eq('profile_id', profileId)
    .order('sold_at', { ascending: false })
    .limit(5000)

  if (from) query = query.gte('sold_at', from)
  if (to) query = query.lte('sold_at', to)

  const { data } = await query

  const rows = (data || []).map(s => [
    s.recipe_name, s.quantity, s.unit_price, s.total_revenue, s.total_cost, s.sold_at,
  ])
  return toCsv(['Recipe', 'Qty', 'Unit Price', 'Revenue', 'Cost', 'Sold At'], rows)
}

async function exportTransactions(supabase: Supabase, profileId: string, from?: string, to?: string): Promise<string> {
  let query = supabase
    .from('inventory_transactions')
    .select('type, quantity_grams, tobacco_inventory:tobacco_inventory_id(brand, flavor), created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data } = await query

  const rows = (data || []).map(t => {
    const inv = t.tobacco_inventory as unknown as { brand: string; flavor: string } | null
    return [inv?.brand, inv?.flavor, t.type, t.quantity_grams, t.created_at]
  })
  return toCsv(['Brand', 'Flavor', 'Type', 'Grams', 'Date'], rows)
}
