import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { encrypt } from '@/lib/ready2order/crypto'
import { registerWebhook, createProductGroup, getCompanyInfo } from '@/lib/ready2order/client'

export async function GET(request: NextRequest) {
  try {
    const accountToken = request.nextUrl.searchParams.get('accountToken')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'

    if (!accountToken) {
      return NextResponse.redirect(`${appUrl}/settings?r2o=error&reason=no_token`)
    }

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
      return NextResponse.redirect(`${appUrl}/settings?r2o=error&reason=auth`)
    }

    // Encrypt the account token
    const { encrypted, iv } = encrypt(accountToken)

    // Use admin client to upsert (bypasses RLS for service operations)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch R2O account ID for direct webhook matching
    let r2oAccountId: string | null = null
    try {
      const company = await getCompanyInfo(accountToken)
      r2oAccountId = company.companyId
    } catch {
      // Non-critical — webhook handler falls back to brute-force matching
    }

    // Create a product group in r2o for hookah products
    let productGroupId: number | null = null
    try {
      const group = await createProductGroup(accountToken, 'Hookah Torus')
      productGroupId = group.productGroup_id
    } catch {
      // Product group creation is optional
    }

    // Register webhook for invoice events (include secret in URL for verification)
    let webhookRegistered = false
    try {
      const webhookSecret = process.env.R2O_WEBHOOK_SECRET
      const webhookUrl = webhookSecret
        ? `${appUrl}/api/r2o/webhooks?secret=${encodeURIComponent(webhookSecret)}`
        : `${appUrl}/api/r2o/webhooks`
      await registerWebhook(accountToken, webhookUrl, ['invoice.created'])
      webhookRegistered = true
    } catch {
      // Webhook registration is optional, can be retried later
    }

    // Upsert connection
    const { error: upsertError } = await supabaseAdmin
      .from('r2o_connections')
      .upsert({
        profile_id: user.id,
        encrypted_token: encrypted,
        token_iv: iv,
        status: 'connected',
        webhook_registered: webhookRegistered,
        product_group_id: productGroupId,
        r2o_account_id: r2oAccountId,
      }, {
        onConflict: 'profile_id',
      })

    if (upsertError) {
      console.error('r2o connection upsert error:', upsertError)
      return NextResponse.redirect(`${appUrl}/settings?r2o=error&reason=db`)
    }

    return NextResponse.redirect(`${appUrl}/settings?r2o=connected`)
  } catch (error) {
    console.error('r2o callback error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'
    return NextResponse.redirect(`${appUrl}/settings?r2o=error&reason=unknown`)
  }
}
