import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface OrderItem {
  name: string
  quantity: number
  details: string | null
}

interface OrderBody {
  table_id: string
  guest_name?: string | null
  type: 'bar' | 'hookah'
  items: OrderItem[]
  notes?: string | null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  let body: OrderBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { table_id, guest_name, type, items, notes } = body

  // Validate required fields
  if (!table_id || !type || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields: table_id, type, items' }, { status: 400 })
  }

  if (type !== 'bar' && type !== 'hookah') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Validate items
  for (const item of items) {
    if (!item.name || typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: 'Invalid item: name and quantity required' }, { status: 400 })
    }
  }

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

  // Validate table belongs to this profile
  const { data: table, error: tableError } = await supabase
    .from('floor_tables')
    .select('id, name')
    .eq('id', table_id)
    .eq('profile_id', profile.id)
    .single()

  if (tableError || !table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 400 })
  }

  // Rate limit: max 1 guest order per table per 30 seconds
  const { data: recentOrder } = await supabase
    .from('kds_orders')
    .select('created_at')
    .eq('table_id', table_id)
    .eq('source', 'guest_qr')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentOrder) {
    const elapsed = Date.now() - new Date(recentOrder.created_at).getTime()
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
