import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { R2OWebhookEvent } from '@/lib/ready2order/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as R2OWebhookEvent

    if (!body.event || !body.accountId) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the profile associated with this r2o account
    // We match by checking which connection has a valid token
    // Since r2o doesn't send profile_id, we look up all connections
    // In practice, accountId from webhook should be verified against stored connections
    const { data: connections } = await supabaseAdmin
      .from('r2o_connections')
      .select('profile_id')
      .eq('status', 'connected')

    if (!connections || connections.length === 0) {
      return NextResponse.json({ received: true })
    }

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

      // Try to match to a specific profile by checking product mappings
      for (const conn of connections) {
        const { data: mappings } = await supabaseAdmin
          .from('r2o_product_mappings')
          .select('r2o_product_id')
          .eq('profile_id', conn.profile_id)

        if (!mappings || mappings.length === 0) continue

        const mappedProductIds = new Set(mappings.map(m => m.r2o_product_id))
        const invoiceItems = (invoiceData.invoice_items || []) as Array<{ product_id?: number }>
        const hasMatchingProducts = invoiceItems.some(
          item => item.product_id && mappedProductIds.has(item.product_id)
        )

        if (hasMatchingProducts) {
          // Log the sale
          await supabaseAdmin
            .from('r2o_sales_log')
            .insert({
              profile_id: conn.profile_id,
              r2o_invoice_id: invoiceData.invoice_id,
              invoice_number: invoiceData.invoice_number || '',
              invoice_timestamp: invoiceData.invoice_timestamp || new Date().toISOString(),
              total_price: invoiceData.invoice_totalPrice || 0,
              items: invoiceData.invoice_items || [],
              processed: false,
            })

          // Decrement stock for matching products
          for (const item of invoiceItems) {
            if (!item.product_id || !mappedProductIds.has(item.product_id)) continue

            const invoiceItem = item as { product_id: number; item_quantity?: number }
            const { data: mapping } = await supabaseAdmin
              .from('r2o_product_mappings')
              .select('tobacco_inventory_id')
              .eq('profile_id', conn.profile_id)
              .eq('r2o_product_id', invoiceItem.product_id)
              .single()

            if (mapping) {
              const gramsUsed = invoiceItem.item_quantity || 1
              // Decrement inventory
              const { data: inventory } = await supabaseAdmin
                .from('tobacco_inventory')
                .select('quantity_grams')
                .eq('id', mapping.tobacco_inventory_id)
                .single()

              if (inventory) {
                const newQuantity = Math.max(0, inventory.quantity_grams - gramsUsed)
                await supabaseAdmin
                  .from('tobacco_inventory')
                  .update({ quantity_grams: newQuantity })
                  .eq('id', mapping.tobacco_inventory_id)
              }
            }
          }

          break
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
