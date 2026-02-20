import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_TO_TIER } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Create admin Supabase client (lazy init)
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase is not configured')
    }
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

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
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
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
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    console.error('No user ID found in checkout session')
    return
  }

  const supabase = getSupabaseAdmin()
  const customerId = session.customer as string

  // Link Stripe customer ID to profile
  if (customerId) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  // If a subscription was created, update the profile
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    await updateUserSubscription(userId, subscription)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id

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
      console.error('Could not find user for subscription:', subscription.id)
      return
    }

    await updateUserSubscription(profile.id, subscription)
  } else {
    await updateUserSubscription(userId, subscription)
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  const tier = priceId ? PRICE_TO_TIER[priceId] : 'free'
  const status = subscription.status

  // Only update if subscription is active or trialing
  if (status === 'active' || status === 'trialing') {
    // Get current period end from subscription (Stripe returns Unix timestamp)
    const currentPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end
    const expiresAt = new Date(currentPeriodEnd * 1000).toISOString()

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier || 'pro',
        subscription_expires_at: expiresAt,
        stripe_subscription_id: subscription.id,
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update subscription:', error)
    }
  } else if (status === 'past_due' || status === 'unpaid' || status === 'canceled') {
    // Downgrade to free on failed payment or cancellation
    const supabase = getSupabaseAdmin()
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_expires_at: null,
        stripe_subscription_id: status === 'canceled' ? null : subscription.id,
      })
      .eq('id', userId)
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
    console.error('Could not find user for deleted subscription')
    return
  }

  // Downgrade to free tier
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_expires_at: null,
      stripe_subscription_id: null,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Failed to downgrade subscription:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Renewal payment — ensure subscription tier is correct
  const invoiceAny = invoice as unknown as Record<string, unknown>
  const subscriptionId = (invoiceAny.subscription || invoiceAny.subscription_id) as string | null
  if (!subscriptionId || !stripe) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const customerId = (invoiceAny.customer || invoiceAny.customer_id) as string

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
  // Mark subscription as expired when payment fails
  const invoiceAny = invoice as unknown as Record<string, unknown>
  const customerId = (invoiceAny.customer || invoiceAny.customer_id) as string
  if (!customerId) return

  const supabase = getSupabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_expires_at: null,
      })
      .eq('id', profile.id)
  }
}
