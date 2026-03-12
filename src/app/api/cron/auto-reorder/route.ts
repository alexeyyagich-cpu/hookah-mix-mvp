import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { sendMessage, isTelegramConfigured } from '@/lib/telegram/bot'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

// Generate order number matching client-side format
function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `ORD-${dateStr}-${timeStr}-${random}`
}

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:auto-reorder', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Fetch all enabled auto-reorder rules with inventory and product details
  const { data: rules, error: rulesError } = await supabase
    .from('auto_reorder_rules')
    .select(`
      id, profile_id, organization_id, tobacco_inventory_id, supplier_product_id,
      threshold_grams, reorder_quantity, is_enabled, last_triggered_at,
      tobacco:tobacco_inventory(id, brand, flavor, quantity_grams),
      product:supplier_products(id, supplier_id, brand, flavor, price, package_grams, in_stock)
    `)
    .eq('is_enabled', true)
    .limit(500)

  if (rulesError) {
    logger.error('Cron auto-reorder: rules query failed', { error: String(rulesError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!rules || rules.length === 0) {
    return NextResponse.json({ message: 'No active rules', orders: 0 })
  }

  // Filter triggered rules (stock <= threshold) and not triggered in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  interface RuleWithDetails {
    id: string
    profile_id: string
    organization_id: string | null
    tobacco_inventory_id: string
    supplier_product_id: string
    threshold_grams: number
    reorder_quantity: number
    last_triggered_at: string | null
    tobacco: { id: string; brand: string; flavor: string; quantity_grams: number } | null
    product: { id: string; supplier_id: string; brand: string; flavor: string; price: number; package_grams: number; in_stock: boolean } | null
  }

  const triggeredRules = (rules as unknown as RuleWithDetails[]).filter(rule => {
    if (!rule.tobacco || !rule.product) return false
    if (!rule.product.in_stock) return false
    // Already triggered within 24h — skip to avoid duplicate orders
    if (rule.last_triggered_at && rule.last_triggered_at > oneDayAgo) return false
    return rule.tobacco.quantity_grams <= rule.threshold_grams
  })

  if (triggeredRules.length === 0) {
    return NextResponse.json({ message: 'No rules triggered', checked: rules.length, orders: 0 })
  }

  // Group triggered rules by profile + supplier for order consolidation
  const grouped = new Map<string, RuleWithDetails[]>()
  for (const rule of triggeredRules) {
    const key = `${rule.profile_id}:${rule.product!.supplier_id}`
    const existing = grouped.get(key) || []
    existing.push(rule)
    grouped.set(key, existing)
  }

  let ordersCreated = 0

  const results = await Promise.allSettled(
    [...grouped.entries()].map(async ([key, groupedRules]) => {
      const [profileId, supplierId] = key.split(':')
      const firstRule = groupedRules[0]

      // Fetch supplier for delivery estimate
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('delivery_days_max, name, min_order_amount')
        .eq('id', supplierId)
        .single()

      if (!supplier) return 0

      // Calculate order totals
      const items = groupedRules.map(rule => ({
        supplier_product_id: rule.product!.id,
        tobacco_id: rule.tobacco!.id,
        brand: rule.product!.brand,
        flavor: rule.product!.flavor,
        quantity: rule.reorder_quantity,
        unit_price: rule.product!.price,
        package_grams: rule.product!.package_grams,
        total_price: rule.product!.price * rule.reorder_quantity,
      }))

      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)

      // Skip if below minimum order amount
      if (subtotal < supplier.min_order_amount) {
        logger.info('Cron auto-reorder: order below minimum', {
          profileId, supplierId, subtotal, minimum: supplier.min_order_amount,
        })
        return 0
      }

      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + (supplier.delivery_days_max || 5))

      // Create marketplace order
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          profile_id: profileId,
          supplier_id: supplierId,
          order_number: generateOrderNumber(),
          status: 'pending',
          subtotal,
          shipping_cost: 0,
          total: subtotal,
          notes: 'Auto-reorder triggered by low stock',
          estimated_delivery_date: estimatedDelivery.toISOString().slice(0, 10),
          is_auto_order: true,
          ...(firstRule.organization_id ? { organization_id: firstRule.organization_id } : {}),
        })
        .select('id, order_number')
        .single()

      if (orderError) {
        logger.error('Cron auto-reorder: order creation failed', { profileId, error: String(orderError) })
        return 0
      }

      // Create order items
      const orderItems = items.map(item => ({ ...item, order_id: order.id }))
      const { error: itemsError } = await supabase
        .from('marketplace_order_items')
        .insert(orderItems)

      if (itemsError) {
        logger.error('Cron auto-reorder: items creation failed', { orderId: order.id, error: String(itemsError) })
        // Rollback orphaned order
        await supabase.from('marketplace_orders').delete().eq('id', order.id)
        return 0
      }

      // Update last_triggered_at for all rules in this group
      const ruleIds = groupedRules.map(r => r.id)
      await supabase
        .from('auto_reorder_rules')
        .update({ last_triggered_at: new Date().toISOString() })
        .in('id', ruleIds)

      // Notify owner
      const itemsList = groupedRules
        .map(r => `• ${r.product!.brand} ${r.product!.flavor}: ${r.reorder_quantity} pcs`)
        .join('\n')

      if (isPushConfigured) {
        await sendPushToUser(profileId, {
          title: `Auto-reorder: ${order.order_number}`,
          body: `${groupedRules.length} item(s) ordered from ${supplier.name}`,
          tag: 'auto-reorder',
          url: '/marketplace/orders',
        }).catch(() => {})
      }

      if (isTelegramConfigured) {
        const { data: tgConn } = await supabase
          .from('telegram_connections')
          .select('chat_id')
          .eq('profile_id', profileId)
          .eq('is_active', true)
          .single()

        if (tgConn) {
          await sendMessage(tgConn.chat_id,
            `🛒 <b>Auto-Reorder Created</b>\n\nOrder: <b>${order.order_number}</b>\nSupplier: ${supplier.name}\n\n${itemsList}\n\nTotal: €${(subtotal / 100).toFixed(2)}\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'}/marketplace/orders">View Orders</a>`,
            { parseMode: 'HTML' }
          ).catch(() => {})
        }
      }

      logger.info('Cron auto-reorder: order created', {
        orderId: order.id, orderNumber: order.order_number,
        profileId, items: groupedRules.length, total: subtotal,
      })

      return 1
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') ordersCreated += result.value
    else logger.error('Cron auto-reorder: error', { error: String(result.reason) })
  }

  return NextResponse.json({
    checked: rules.length,
    triggered: triggeredRules.length,
    orders: ordersCreated,
  })
}
