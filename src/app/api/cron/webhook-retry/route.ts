import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

// Max retry attempts before marking as dead
const MAX_RETRIES = 5

interface WebhookEvent {
  id: string
  source: string
  event_type: string
  payload: Record<string, unknown>
  retry_count: number
  created_at: string
}

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:webhook-retry', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Query webhook_events table (not in generated types yet — use raw query)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingEvents, error: queryError } = await (supabase as any)
    .from('webhook_events')
    .select('id, source, event_type, payload, retry_count, created_at')
    .eq('status', 'failed')
    .lt('retry_count', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(50) as { data: WebhookEvent[] | null; error: { code?: string; message: string } | null }

  if (queryError) {
    // Table might not exist yet — that's OK, skip silently
    if (queryError.code === '42P01') {
      return NextResponse.json({ message: 'webhook_events table not found — run migration', retried: 0 })
    }
    logger.error('Cron webhook-retry: query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!pendingEvents || pendingEvents.length === 0) {
    return NextResponse.json({ message: 'No pending retries', retried: 0 })
  }

  let retried = 0
  let dead = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const results = await Promise.allSettled(
    pendingEvents.map(async (event) => {
      try {
        // Re-dispatch the webhook payload to the original handler
        const handlerUrl = getHandlerUrl(event.source)
        if (!handlerUrl) {
          await sb.from('webhook_events')
            .update({ status: 'dead', last_error: 'Unknown source', updated_at: new Date().toISOString() })
            .eq('id', event.id)
          dead++
          return 0
        }

        const response = await fetch(handlerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-retry': 'true',
            'x-api-key': process.env.INTERNAL_API_KEY || '',
          },
          body: JSON.stringify(event.payload),
        })

        if (response.ok) {
          await sb.from('webhook_events')
            .update({ status: 'resolved', updated_at: new Date().toISOString() })
            .eq('id', event.id)
          return 1
        }

        // Still failing — increment retry count
        const newCount = event.retry_count + 1
        const newStatus = newCount >= MAX_RETRIES ? 'dead' : 'failed'

        await sb.from('webhook_events')
          .update({
            retry_count: newCount,
            status: newStatus,
            last_error: `HTTP ${response.status}: ${response.statusText}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)

        if (newStatus === 'dead') dead++
        return 0
      } catch (err) {
        const newCount = event.retry_count + 1
        const newStatus = newCount >= MAX_RETRIES ? 'dead' : 'failed'

        await sb.from('webhook_events')
          .update({
            retry_count: newCount,
            status: newStatus,
            last_error: String(err),
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)

        if (newStatus === 'dead') dead++
        return 0
      }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') retried += result.value
    else logger.error('Cron webhook-retry: error', { error: String(result.reason) })
  }

  if (dead > 0) {
    logger.warn('Cron webhook-retry: dead letter events', { dead })
  }

  return NextResponse.json({ retried, dead, checked: pendingEvents.length })
}

function getHandlerUrl(source: string): string | null {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'
  switch (source) {
    case 'r2o': return `${base}/api/r2o/webhooks`
    case 'stripe': return `${base}/api/stripe/webhook`
    default: return null
  }
}
