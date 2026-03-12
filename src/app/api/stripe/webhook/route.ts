import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_TO_TIER } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, isEmailConfigured, generatePaymentFailureEmailHtml } from '@/lib/email/resend'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

// Disable body parsing - Stripe requires raw body for signature verification
export const runtime = 'nodejs'

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  const reader = request.body?.getReader()

  if (!reader) {
    throw new Error('No body')
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  return Buffer.concat(chunks)
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const rawBody = await getRawBody(request)
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      )
    } catch (err) {
      logger.error('Webhook signature verification failed', { err: String(err) })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook error', { error: String(error) })
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    logger.error('No user ID found in checkout session')
    return
  }

  const supabase = getSupabaseAdmin()
  const customerId = session.customer as string

  // Link Stripe customer ID to profile
  if (customerId) {
    const { error: linkError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)

    if (linkError) {
      logger.error('Failed to link Stripe customer ID', { error: String(linkError), userId })
    }
  }

  // If a subscription was created, update the profile
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    await updateUserSubscription(userId, subscription)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      logger.error('Could not find user for subscription', { subscription_id: subscription.id })
      return
    }

    await updateUserSubscription(profile.id, subscription)
  } else {
    await updateUserSubscription(userId, subscription)
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  const tier = priceId ? PRICE_TO_TIER[priceId] : 'trial'
  const status = subscription.status

  // Only update if subscription is active or trialing
  if (status === 'active' || status === 'trialing') {
    // In Stripe v20+, current_period_end moved to items; access via first item
    const firstItem = subscription.items.data[0]
    const currentPeriodEnd = firstItem?.current_period_end
    if (!currentPeriodEnd) return
    const expiresAt = new Date(currentPeriodEnd * 1000).toISOString()

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier || 'core',
        subscription_expires_at: expiresAt,
        stripe_subscription_id: subscription.id,
      })
      .eq('id', userId)

    if (error) {
      logger.error('Failed to update subscription', { error: String(error) })
    }
  } else if (status === 'past_due' || status === 'unpaid') {
    // Grace period: keep current tier but set subscription_expires_at to now
    // The cron job subscription-check will hard-downgrade after 7 days
    const supabase = getSupabaseAdmin()

    // Only update expiry if not already set to a past date (avoid resetting grace period)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at, business_name')
      .eq('id', userId)
      .single()

    const alreadyExpired = currentProfile?.subscription_expires_at &&
      new Date(currentProfile.subscription_expires_at) < new Date()

    if (!alreadyExpired) {
      // Start grace period — set expiry to now, tier stays until cron downgrades
      const { error: graceError } = await supabase
        .from('profiles')
        .update({
          subscription_expires_at: new Date().toISOString(),
          stripe_subscription_id: subscription.id,
        })
        .eq('id', userId)

      if (graceError) {
        logger.error('Failed to set grace period', { error: String(graceError), userId })
      }

      logger.warn('Subscription past_due — grace period started', { userId, status })

      // Notify user about payment failure
      await notifyPaymentFailure(userId, currentProfile?.business_name || 'Your business')
    }
  } else if (status === 'canceled') {
    // Cancellation = immediate downgrade (user explicitly canceled)
    const supabase = getSupabaseAdmin()
    const { error: downgradeError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'trial',
        subscription_expires_at: null,
        trial_expires_at: new Date().toISOString(),
        stripe_subscription_id: null,
      })
      .eq('id', userId)

    if (downgradeError) {
      logger.error('Failed to downgrade subscription', { error: String(downgradeError), userId })
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const supabase = getSupabaseAdmin()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    logger.error('Could not find user for deleted subscription')
    return
  }

  // Downgrade to expired trial (read-only mode)
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'trial',
      subscription_expires_at: null,
      trial_expires_at: new Date().toISOString(), // immediately expired
      stripe_subscription_id: null,
    })
    .eq('id', profile.id)

  if (error) {
    logger.error('Failed to downgrade subscription', { error: String(error) })
  }
}

// Extract string ID from a Stripe expandable field (string | object | null)
function extractId(field: unknown): string | null {
  if (typeof field === 'string') return field
  if (field && typeof field === 'object' && 'id' in field) return (field as { id: string }).id
  return null
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Renewal payment — ensure subscription tier is correct
  // Invoice fields may be string IDs or expanded objects depending on Stripe API version
  const subscriptionId = extractId((invoice as unknown as Record<string, unknown>).subscription)
  if (!subscriptionId || !stripe) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = extractId(invoice.customer) ?? ''

  const supabase = getSupabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    await updateUserSubscription(profile.id, subscription)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Log payment failure and notify user.
  // Stripe retries failed payments multiple times over days.
  // Hard downgrade happens via cron subscription-check after 7-day grace period.
  const customerId = extractId(invoice.customer) ?? 'unknown'
  logger.warn('Payment failed', { customerId, invoiceId: invoice.id })

  // Find user and notify
  if (customerId !== 'unknown') {
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, business_name')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      await notifyPaymentFailure(profile.id, profile.business_name || 'Your business')
    }
  }
}

async function notifyPaymentFailure(userId: string, businessName: string) {
  const message = 'Your payment could not be processed. You have a 7-day grace period to update your payment method before your account is downgraded.'

  // Email notification
  if (isEmailConfigured) {
    try {
      const supabase = getSupabaseAdmin()
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      if (authUser?.user?.email) {
        await sendEmail({
          to: authUser.user.email,
          subject: 'Payment failed — action required',
          html: generatePaymentFailureEmailHtml(businessName, message),
        })
      }
    } catch (err) {
      logger.error('Failed to send payment failure email', { error: String(err), userId })
    }
  }

  // Push notification
  if (isPushConfigured) {
    await sendPushToUser(userId, {
      title: 'Payment failed',
      body: message,
      tag: 'payment-failed',
      url: '/pricing',
      requireInteraction: true,
    }).catch((err) => logger.error('Failed to send payment failure push', { error: String(err) }))
  }
}
