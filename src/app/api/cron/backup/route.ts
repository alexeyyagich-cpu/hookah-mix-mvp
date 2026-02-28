import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

// All business tables to back up
const TABLES = [
  'profiles',
  'organizations',
  'locations',
  'org_members',
  'invite_tokens',
  'tobacco_inventory',
  'bowl_types',
  'sessions',
  'session_items',
  'inventory_transactions',
  'saved_mixes',
  'guests',
  'floor_tables',
  'shifts',
  'lounge_profiles',
  'notification_settings',
  'email_settings',
  'telegram_connections',
  'push_subscriptions',
  'staff_invitations',
  'reviews',
  'reservations',
  'suppliers',
  'supplier_products',
  'marketplace_orders',
  'marketplace_order_items',
  'auto_reorder_rules',
  'bar_inventory',
  'bar_transactions',
  'bar_recipes',
  'bar_recipe_ingredients',
  'bar_sales',
  'kds_orders',
  'r2o_connections',
  'r2o_product_mappings',
  'r2o_sales_log',
  'qr_tips',
  'promotions',
  'loyalty_program',
] as const

const BUCKET = 'backups'
const RETENTION_DAYS = 30

export async function GET(request: NextRequest) {
  // Rate limit
  const rateCheck = await checkRateLimit('cron:backup', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const timestamp = new Date().toISOString()
  const dateStr = timestamp.slice(0, 10) // YYYY-MM-DD

  try {
    // Dump all tables in parallel
    const tables: Record<string, unknown[]> = {}
    let totalRows = 0
    const errors: string[] = []

    const results = await Promise.all(
      TABLES.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(50000)
        return { table, data, error }
      })
    )

    for (const { table, data, error } of results) {
      if (error) {
        errors.push(`${table}: ${error.message}`)
        continue
      }
      tables[table] = data || []
      totalRows += (data || []).length
    }

    const backup = {
      meta: {
        timestamp,
        tables_count: Object.keys(tables).length,
        total_rows: totalRows,
        errors: errors.length > 0 ? errors : undefined,
      },
      tables,
    }

    const json = JSON.stringify(backup)
    const sizeKb = Math.round(json.length / 1024)
    const fileName = `backup-${dateStr}.json`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, json, {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadError) {
      logger.error('Backup upload failed', { error: String(uploadError) })
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      )
    }

    // Cleanup: delete backups older than RETENTION_DAYS
    let deleted = 0
    const { data: files } = await supabase.storage.from(BUCKET).list()
    if (files) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

      const oldFiles = files.filter(f => {
        // Extract date from filename: backup-YYYY-MM-DD.json
        const match = f.name.match(/backup-(\d{4}-\d{2}-\d{2})\.json/)
        if (!match) return false
        return new Date(match[1]) < cutoff
      })

      if (oldFiles.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(BUCKET)
          .remove(oldFiles.map(f => f.name))

        if (!deleteError) deleted = oldFiles.length
      }
    }

    return NextResponse.json({
      ok: true,
      file: fileName,
      tables: Object.keys(tables).length,
      totalRows,
      sizeKb,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    logger.error('Backup cron failed', { error: String(err) })
    return NextResponse.json(
      { error: 'Backup failed' },
      { status: 500 }
    )
  }
}
