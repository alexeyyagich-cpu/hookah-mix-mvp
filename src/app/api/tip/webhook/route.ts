import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

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
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const webhookSecret = process.env.STRIPE_TIP_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Tip webhook secret not configured' },
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

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err) {
      logger.error('Tip webhook signature verification failed', { error: String(err) })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Only handle tip payments
      if (session.metadata?.type !== 'tip') {
        return NextResponse.json({ received: true })
      }

      const staffProfileId = session.metadata.staff_profile_id
      const payerName = session.metadata.payer_name?.slice(0, 100) || null
      const message = session.metadata.message?.slice(0, 500) || null
      const amountTotal = session.amount_total

      if (!staffProfileId || !amountTotal) {
        logger.error('Missing tip metadata in checkout session')
        return NextResponse.json({ received: true })
      }

      const supabase = getSupabaseAdmin()
      const paymentIntentId = session.payment_intent as string

      // Idempotency: skip if this payment intent was already recorded
      if (paymentIntentId) {
        const { data: existing } = await supabase
          .from('tips')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .limit(1)
          .maybeSingle()

        if (existing) {
          return NextResponse.json({ received: true })
        }
      }

      const { error: insertError } = await supabase.from('tips').insert({
        staff_profile_id: staffProfileId,
        amount: amountTotal / 100,
        currency: (session.currency || 'eur').toUpperCase(),
        stripe_payment_intent_id: paymentIntentId,
        status: 'completed',
        payer_name: payerName,
        message,
      })

      if (insertError) {
        logger.error('Failed to insert tip', { error: String(insertError) })
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Tip webhook error', { error: String(error) })
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
