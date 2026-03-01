import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/ready2order/crypto'
import { createProduct, updateProduct, getProducts } from '@/lib/ready2order/client'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { getUserTier, hasFeatureAccess, featureNotAvailable } from '@/lib/subscriptionGuard'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = await checkRateLimit(`${ip}:/api/r2o/sync`, rateLimits.strict)
    if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

    // Verify authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Subscription check: R2O sync requires api_access (multi+ tier)
    const tier = await getUserTier(supabase, user.id)
    if (!hasFeatureAccess(tier, 'api_access')) {
      return featureNotAvailable('pos_integration')
    }

    // Get r2o connection using admin client (encrypted token should not traverse RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: connection } = await supabaseAdmin
      .from('r2o_connections')
      .select('id, profile_id, encrypted_token, token_iv, product_group_id, status')
      .eq('profile_id', user.id)
      .eq('status', 'connected')
      .single()

    if (!connection) {
      return NextResponse.json(
        { error: 'No active POS connection' },
        { status: 404 }
      )
    }

    if (!connection.encrypted_token || !connection.token_iv) {
      return NextResponse.json(
        { error: 'Connection credentials missing' },
        { status: 500 }
      )
    }

    // Decrypt token
    const accountToken = decrypt(connection.encrypted_token, connection.token_iv)

    // Get user's tobacco inventory
    const { data: inventory } = await supabase
      .from('tobacco_inventory')
      .select('id, tobacco_id, brand, flavor, quantity_grams, purchase_price, package_grams')
      .eq('profile_id', user.id)

    if (!inventory || inventory.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No inventory to sync' })
    }

    // Get existing product mappings
    const { data: existingMappings, error: mappingsError } = await supabase
      .from('r2o_product_mappings')
      .select('id, profile_id, tobacco_inventory_id, r2o_product_id, r2o_product_name, sync_status, last_synced_at')
      .eq('profile_id', user.id)

    if (mappingsError) {
      logger.error('Failed to fetch product mappings', { error: String(mappingsError) })
    }

    const mappingsByInventoryId = new Map(
      (existingMappings || []).map(m => [m.tobacco_inventory_id, m])
    )

    // Get existing r2o products for reference
    const r2oProducts = await getProducts(accountToken)
    const r2oProductsByName = new Map(
      r2oProducts.map(p => [p.product_name, p])
    )

    let synced = 0
    let errors = 0

    for (const item of inventory) {
      const productName = `${item.brand} — ${item.flavor}`
      const existingMapping = mappingsByInventoryId.get(item.id)

      try {
        if (existingMapping) {
          // Update existing product stock + group
          await updateProduct(accountToken, existingMapping.r2o_product_id, {
            product_stock: Math.round(item.quantity_grams),
            product_name: productName,
            ...(connection.product_group_id ? { product_group_id: connection.product_group_id } : {}),
          })

          const { error: updateMappingError } = await supabaseAdmin
            .from('r2o_product_mappings')
            .update({
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
              r2o_product_name: productName,
            })
            .eq('id', existingMapping.id)

          if (updateMappingError) {
            logger.error('Failed to update product mapping', { error: String(updateMappingError), product: productName })
          }
        } else {
          // Check if product already exists in r2o by name
          const existingR2O = r2oProductsByName.get(productName)

          let r2oProductId: number
          if (existingR2O) {
            // Update existing r2o product
            await updateProduct(accountToken, existingR2O.product_id, {
              product_stock: Math.round(item.quantity_grams),
            })
            r2oProductId = existingR2O.product_id
          } else {
            // Create new product in r2o
            // Calculate price per gram if purchase_price is available
            const price = item.purchase_price && item.package_grams
              ? (item.purchase_price / item.package_grams)
              : 0

            const newProduct = await createProduct(accountToken, {
              product_name: productName,
              product_price: Math.round(price * 100) / 100,
              product_vat: 19, // German standard VAT
              product_group_id: connection.product_group_id || undefined,
              product_stockEnabled: true,
              product_stock: Math.round(item.quantity_grams),
            })
            r2oProductId = newProduct.product_id
          }

          // Create mapping
          await supabaseAdmin
            .from('r2o_product_mappings')
            .insert({
              profile_id: user.id,
              tobacco_inventory_id: item.id,
              r2o_product_id: r2oProductId,
              r2o_product_name: productName,
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            })
        }
        synced++
      } catch (err) {
        logger.error('Failed to sync product', { product: productName, error: String(err) })
        errors++

        if (existingMapping) {
          await supabaseAdmin
            .from('r2o_product_mappings')
            .update({ sync_status: 'error' })
            .eq('id', existingMapping.id)
        }
      }
    }

    // Update last sync timestamp
    const { error: syncTsError } = await supabaseAdmin
      .from('r2o_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('profile_id', user.id)

    if (syncTsError) {
      logger.error('Failed to update sync timestamp', { error: String(syncTsError) })
    }

    return NextResponse.json({ synced, errors, total: inventory.length })
  } catch (error) {
    logger.error('R2O sync error', { error: String(error) })
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
