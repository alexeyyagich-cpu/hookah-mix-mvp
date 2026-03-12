import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimits, rateLimitExceeded, getClientIp } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const heartbeatSchema = z.object({
  device_id: z.string().min(1).max(100),
  device_name: z.string().max(200).optional(),
  pending_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
})

// POST: Device reports its sync queue status
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`sync-heartbeat:${ip}`, rateLimits.relaxed)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const { user, response: authResponse } = await getAuthenticatedUser()
  if (!user) return authResponse

  let body: z.infer<typeof heartbeatSchema>
  try {
    const raw = await request.json()
    body = heartbeatSchema.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Upsert heartbeat record (one per device per user)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('sync_heartbeats')
      .upsert({
        profile_id: user.id,
        device_id: body.device_id,
        device_name: body.device_name || null,
        pending_count: body.pending_count,
        failed_count: body.failed_count,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,device_id',
      })

    if (error) {
      // Table may not exist yet — log but don't fail
      if (error.code === '42P01') {
        return NextResponse.json({ ok: true, message: 'sync_heartbeats table not found — run migration' })
      }
      logger.error('Sync heartbeat upsert failed', { error: String(error), userId: user.id })
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('Sync heartbeat failed', { userId: user.id, error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET: Owner checks all device sync statuses
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`sync-status:${ip}`, rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const { user, response: authResponse } = await getAuthenticatedUser()
  if (!user) return authResponse

  try {
    const supabase = getSupabaseAdmin()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('sync_heartbeats')
      .select('device_id, device_name, pending_count, failed_count, last_seen_at')
      .eq('profile_id', user.id)
      .order('last_seen_at', { ascending: false })
      .limit(50) as { data: SyncHeartbeat[] | null; error: { code?: string; message: string } | null }

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ devices: [], message: 'sync_heartbeats table not found — run migration' })
      }
      logger.error('Sync status query failed', { error: String(error), userId: user.id })
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const now = Date.now()
    const devices = (data || []).map(d => ({
      ...d,
      is_online: now - new Date(d.last_seen_at).getTime() < 5 * 60 * 1000, // 5 min threshold
      has_issues: d.failed_count > 0 || d.pending_count > 10,
    }))

    const totalPending = devices.reduce((sum, d) => sum + d.pending_count, 0)
    const totalFailed = devices.reduce((sum, d) => sum + d.failed_count, 0)
    const onlineCount = devices.filter(d => d.is_online).length

    return NextResponse.json({
      devices,
      summary: {
        total_devices: devices.length,
        online: onlineCount,
        total_pending: totalPending,
        total_failed: totalFailed,
        all_synced: totalPending === 0 && totalFailed === 0,
      },
    })
  } catch (err) {
    logger.error('Sync status failed', { userId: user.id, error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

interface SyncHeartbeat {
  device_id: string
  device_name: string | null
  pending_count: number
  failed_count: number
  last_seen_at: string
}
