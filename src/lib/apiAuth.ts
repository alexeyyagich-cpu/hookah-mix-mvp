import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export interface ApiKeyContext {
  organizationId: string
  profileId: string
}

/**
 * Hash an API key for safe storage (SHA-256).
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Generate a new API key: `ht_live_<32 random hex chars>`
 */
export function generateApiKey(): string {
  return `ht_live_${crypto.randomBytes(32).toString('hex')}`
}

/**
 * Verify Bearer token from API key, return org context or null.
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ht_live_')) return null

  const key = auth.slice(7) // Remove "Bearer "
  const hashed = hashApiKey(key)

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('api_keys')
    .select('organization_id, profile_id, is_active')
    .eq('key_hash', hashed)
    .eq('is_active', true)
    .single()

  if (!data) return null

  // Update last_used_at (fire and forget)
  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hashed)

  return {
    organizationId: data.organization_id,
    profileId: data.profile_id,
  }
}

/**
 * Middleware: require valid API key, return 401 if invalid.
 */
export async function withApiKey(
  request: NextRequest,
  handler: (ctx: ApiKeyContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const ctx = await verifyApiKey(request)
  if (!ctx) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }
  return handler(ctx)
}
