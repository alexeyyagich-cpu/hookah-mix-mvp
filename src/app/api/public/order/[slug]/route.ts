import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicOrderSchema, slugSchema, validateBody } from '@/lib/validation'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    if (elapsed < 30000) {
      return NextResponse.json({ error: 'Rate limited', retry_after: Math.ceil((30000 - elapsed) / 1000) }, { status: 429 })
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
      items,
      notes: notes || null,
      source: 'guest_qr',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Failed to create guest order:', insertError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  return NextResponse.json({ success: true, orderId: order.id })
}
