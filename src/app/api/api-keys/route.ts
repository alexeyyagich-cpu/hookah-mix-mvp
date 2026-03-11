import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { generateApiKey, hashApiKey } from '@/lib/apiAuth'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

/**
 * GET /api/api-keys — List API keys for current org (hashes only, no plaintext)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member || !['owner', 'manager'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()
  const { data: keys } = await admin
    .from('api_keys')
    .select('id, label, is_active, last_used_at, created_at')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys || [] })
}

/**
 * POST /api/api-keys — Generate a new API key
 */
export async function POST(request: NextRequest) {
  const rateCheck = await checkRateLimit('api-keys:create', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member || !['owner', 'manager'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const label = typeof body.label === 'string' ? body.label.slice(0, 100) : 'default'

  // Limit: max 5 keys per org
  const admin = getSupabaseAdmin()
  const { count } = await admin
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', member.organization_id)
    .eq('is_active', true)

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: 'Maximum 5 active API keys per organization' }, { status: 400 })
  }

  const plainKey = generateApiKey()
  const keyHash = hashApiKey(plainKey)

  const { error } = await admin
    .from('api_keys')
    .insert({
      organization_id: member.organization_id,
      profile_id: user.id,
      key_hash: keyHash,
      label,
    })

  if (error) {
    logger.error('Failed to create API key', { error: String(error) })
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }

  // Return plaintext key ONCE — it cannot be retrieved later
  return NextResponse.json({ key: plainKey, label }, { status: 201 })
}

/**
 * DELETE /api/api-keys — Revoke an API key by ID
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can revoke keys' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const keyId = body.id
  if (!keyId) return NextResponse.json({ error: 'Missing key id' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('organization_id', member.organization_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
