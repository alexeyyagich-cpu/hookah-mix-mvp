import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { adminOrgUpdateSchema, validateBody } from '@/lib/validation'
import { getAdminUser } from '@/lib/supabase/apiAuth'

export async function GET(request: Request) {
  const rateCheck = await checkRateLimit('admin:organizations', rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const admin = await getAdminUser(request)
  if (admin.response) return admin.response
  const { adminClient } = admin

  try {
    // Get all organizations
    const { data: orgs, error } = await adminClient
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get member counts and owner info for each org
    const orgIds = (orgs || []).map(o => o.id)

    const { data: members } = await adminClient
      .from('org_members')
      .select('organization_id, user_id, role, display_name, is_active')
      .in('organization_id', orgIds)
      .eq('is_active', true)

    const { data: locations } = await adminClient
      .from('locations')
      .select('id, organization_id')
      .in('organization_id', orgIds)

    // Build enriched org list
    const enriched = (orgs || []).map(org => {
      const orgMembers = (members || []).filter(m => m.organization_id === org.id)
      const orgLocations = (locations || []).filter(l => l.organization_id === org.id)
      const owner = orgMembers.find(m => m.role === 'owner')

      return {
        ...org,
        member_count: orgMembers.length,
        location_count: orgLocations.length,
        owner_name: owner?.display_name || null,
        owner_email: null, // Don't expose emails in list
        last_activity: null, // Could add sessions query later
      }
    })

    return NextResponse.json(enriched)
  } catch (err) {
    logger.error('Admin organizations error', { error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const rateCheck = await checkRateLimit('admin:organizations:patch', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  // Origin check — defense-in-depth against CSRF
  const origin = request.headers.get('origin')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'
  try {
    if (origin && new URL(origin).origin !== new URL(appUrl).origin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await getAdminUser(request)
  if (admin.response) return admin.response
  const { user, adminClient } = admin

  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = validateBody(adminOrgUpdateSchema, rawBody)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { id, subscription_tier, trial_expires_at, subscription_expires_at } = validation.data

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (subscription_tier) updates.subscription_tier = subscription_tier
    if (trial_expires_at !== undefined) updates.trial_expires_at = trial_expires_at
    if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at

    const { data, error } = await adminClient
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    logger.info('admin.org.update', {
      admin_user_id: user.id,
      org_id: id,
      changes: JSON.stringify(updates),
    })

    return NextResponse.json(data)
  } catch (err) {
    logger.error('Admin org update error', { error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
