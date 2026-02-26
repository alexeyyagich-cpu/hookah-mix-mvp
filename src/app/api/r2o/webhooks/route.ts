import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import type { R2OWebhookEvent } from '@/lib/ready2order/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret from URL query parameter
    const webhookSecret = process.env.R2O_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }
    const urlSecret = request.nextUrl.searchParams.get('secret') || ''
    if (
      urlSecret.length !== webhookSecret.length ||
      !timingSafeEqual(Buffer.from(urlSecret), Buffer.from(webhookSecret))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: R2OWebhookEvent
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body.event || !body.accountId) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the profile associated with this r2o account by accountId (direct lookup)
    const { data: connection } = await supabaseAdmin
      .from('r2o_connections')
      .select('profile_id')
      .eq('r2o_account_id', body.accountId)
      .eq('status', 'connected')
      .single()

    if (!connection) {
      return NextResponse.json({ received: true })
    }

    const profileId = connection.profile_id

    // Handle invoice.created event
    if (body.event === 'invoice.created') {
      const invoiceData = body.data as {
        invoice_id?: number
        invoice_number?: string
        invoice_timestamp?: string
        invoice_totalPrice?: number
        invoice_items?: unknown[]
      }

      if (!invoiceData.invoice_id) {
        return NextResponse.json({ received: true })
      }

      const { data: mappings } = await supabaseAdmin
        .from('r2o_product_mappings')
        .select('r2o_product_id, tobacco_inventory_id')
        .eq('profile_id', profileId)

      if (!mappings || mappings.length === 0) {
        return NextResponse.json({ received: true })
      }

      const mappingsByProductId = new Map(
        mappings.map(m => [m.r2o_product_id, m.tobacco_inventory_id])
      )

      const invoiceItems = (invoiceData.invoice_items || []) as Array<{
        product_id?: number
        item_quantity?: number
      }>

      const hasMatchingProducts = invoiceItems.some(
        item => item.product_id && mappingsByProductId.has(item.product_id)
      )

      if (hasMatchingProducts) {
        // Log the sale
        await supabaseAdmin
          .from('r2o_sales_log')
          .insert({
            profile_id: profileId,
            r2o_invoice_id: invoiceData.invoice_id,
            invoice_number: invoiceData.invoice_number || '',
            invoice_timestamp: invoiceData.invoice_timestamp || new Date().toISOString(),
            total_price: invoiceData.invoice_totalPrice || 0,
            items: invoiceData.invoice_items || [],
            processed: false,
          })

        // Decrement stock for matching products
        for (const item of invoiceItems) {
          if (!item.product_id || !mappingsByProductId.has(item.product_id)) continue

          const inventoryId = mappingsByProductId.get(item.product_id)!
          const gramsUsed = item.item_quantity ?? 1
          // Atomic decrement via RPC (prevents race conditions)
          await supabaseAdmin.rpc('decrement_tobacco_inventory', {
            p_inventory_id: inventoryId,
            p_grams_used: gramsUsed,
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('r2o webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
