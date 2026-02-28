import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/ready2order/crypto'
import { deleteWebhook } from '@/lib/ready2order/client'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = await checkRateLimit(`${ip}:/api/r2o/disconnect`, rateLimits.strict)
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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Read connection to get token for webhook deregistration
    const { data: connection } = await supabaseAdmin
      .from('r2o_connections')
      .select('encrypted_token, token_iv, webhook_registered')
      .eq('profile_id', user.id)
      .single()

    // Deregister webhook on R2O side (best-effort)
    if (connection?.webhook_registered) {
      try {
        const accountToken = decrypt(connection.encrypted_token, connection.token_iv)
        await deleteWebhook(accountToken)
      } catch {
        // Best-effort — token may be expired or R2O unavailable
      }
    }

    // Delete product mappings
    await supabaseAdmin
      .from('r2o_product_mappings')
      .delete()
      .eq('profile_id', user.id)

    // Delete connection (token is destroyed)
    await supabaseAdmin
      .from('r2o_connections')
      .delete()
      .eq('profile_id', user.id)

    return NextResponse.json({ disconnected: true })
  } catch (error) {
    logger.error('R2O disconnect error', { error: String(error) })
    return NextResponse.json(
      { error: 'Disconnect failed' },
      { status: 500 }
    )
  }
}
