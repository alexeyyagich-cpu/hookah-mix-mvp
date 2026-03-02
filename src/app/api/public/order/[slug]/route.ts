import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { publicOrderSchema, slugSchema, validateBody } from '@/lib/validation'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

/** Minimum interval (ms) between guest QR orders for the same table */
const TABLE_ORDER_COOLDOWN_MS = 30_000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`guest-order:${ip}`, rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const { slug } = await params

  const slugResult = slugSchema.safeParse(slug)
  if (!slugResult.success) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = validateBody(publicOrderSchema, body)
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { table_id, guest_name, type, items, notes } = validation.data

  const supabase = getSupabaseAdmin()

  // Resolve slug → profile_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('venue_slug', slug)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  }

  // Validate table + check recent order rate limit in parallel
  const [tableResult, recentOrderResult] = await Promise.all([
    supabase.from('floor_tables').select('id, name').eq('id', table_id).eq('profile_id', profile.id).single(),
    supabase.from('kds_orders').select('created_at').eq('table_id', table_id).eq('source', 'guest_qr').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (tableResult.error || !tableResult.data) {
    return NextResponse.json({ error: 'Table not found' }, { status: 400 })
  }
  const table = tableResult.data

  if (recentOrderResult.data) {
    const elapsed = Date.now() - new Date(recentOrderResult.data.created_at).getTime()
    if (elapsed < TABLE_ORDER_COOLDOWN_MS) {
      return NextResponse.json({ error: 'Rate limited', retry_after: Math.ceil((TABLE_ORDER_COOLDOWN_MS - elapsed) / 1000) }, { status: 429 })
    }
  }

  // Insert order
  const { data: order, error: insertError } = await supabase
    .from('kds_orders')
    .insert({
      profile_id: profile.id,
      table_id: table.id,
      table_name: table.name,
      guest_name: guest_name || null,
      type,
      items: items.map(i => ({ ...i, details: i.details ?? null })),
      notes: notes || null,
      source: 'guest_qr',
    })
    .select('id')
    .single()

  if (insertError) {
    logger.error('Failed to create guest order', { error: String(insertError) })
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  return NextResponse.json({ success: true, orderId: order.id })
}
