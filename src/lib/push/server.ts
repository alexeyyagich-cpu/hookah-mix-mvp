import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:htorus@hookahtorus.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)

interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
  requireInteraction?: boolean
}

export async function sendPushToUser(profileId: string, payload: PushPayload): Promise<number> {
  if (!isPushConfigured) return 0

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return 0

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', profileId)

  if (!subscriptions || subscriptions.length === 0) return 0

  const valid = subscriptions.filter(sub => sub.endpoint && sub.p256dh && sub.auth)
  if (valid.length === 0) return 0

  let sent = 0
  for (const sub of valid) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          tag: payload.tag || 'default',
          data: { url: payload.url || '/dashboard' },
          requireInteraction: payload.requireInteraction || false,
        })
      )
      sent++
    } catch (err: unknown) {
      // Remove expired subscriptions (410 Gone)
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
      }
    }
  }

  return sent
}
