import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import type { SubscriptionTier } from '@/types/database'

function getSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || !anonKey) return null
  return {
    admin: createClient(supabaseUrl, supabaseKey),
    anon: createClient(supabaseUrl, anonKey),
  }
}

async function authenticateSuperAdmin(request: Request, clients: NonNullable<ReturnType<typeof getSupabaseClients>>) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const { data: { user }, error } = await clients.anon.auth.getUser(authHeader.replace('Bearer ', ''))
  if (error || !user) return null

  const { data } = await clients.admin.from('system_superadmins').select('id').eq('user_id', user.id).single()
  return data ? user : null
}

export async function GET(request: Request) {
  const rateCheck = await checkRateLimit('admin:organizations', rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const clients = getSupabaseClients()
  if (!clients) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const user = await authenticateSuperAdmin(request, clients)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Get all organizations
    const { data: orgs, error } = await clients.admin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get member counts and owner info for each org
    const orgIds = (orgs || []).map(o => o.id)

    const { data: members } = await clients.admin
      .from('org_members')
      .select('organization_id, user_id, role, display_name, is_active')
      .in('organization_id', orgIds)
      .eq('is_active', true)

    const { data: locations } = await clients.admin
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
    console.error('Admin organizations error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const rateCheck = await checkRateLimit('admin:organizations:patch', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const clients = getSupabaseClients()
  if (!clients) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const user = await authenticateSuperAdmin(request, clients)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, subscription_tier, trial_expires_at, subscription_expires_at } = body

    if (!id) return NextResponse.json({ error: 'Missing org id' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (subscription_tier) {
      const validTiers: SubscriptionTier[] = ['trial', 'core', 'multi', 'enterprise']
      if (!validTiers.includes(subscription_tier)) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
      }
      updates.subscription_tier = subscription_tier
    }

    if (trial_expires_at !== undefined) updates.trial_expires_at = trial_expires_at
    if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at

    const { data, error } = await clients.admin
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('Admin org update error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
