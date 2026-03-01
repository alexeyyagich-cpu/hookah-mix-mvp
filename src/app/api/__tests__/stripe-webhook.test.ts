import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks (available inside vi.mock factories) ──────────────────

const { mockConstructEvent, mockAdminSingle } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockAdminSingle: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: vi.fn() },
  },
  PRICE_TO_TIER: { price_core_monthly: 'core', price_multi_monthly: 'multi' },
}))

vi.mock('@/lib/supabase/admin', () => {
  const qb = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockAdminSingle,
    then: (resolve: (v: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
  }
  return {
    getSupabaseAdmin: vi.fn(() => ({
      from: vi.fn().mockReturnValue(qb),
    })),
  }
})

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret')

import { POST } from '@/app/api/stripe/webhook/route'

// ── Helpers ─────────────────────────────────────────────────────────────

function createWebhookRequest(body: string, signature = 'test-sig') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': signature,
      'content-type': 'application/json',
    },
  }) as Parameters<typeof POST>[0]
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('/api/stripe/webhook POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const request = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing stripe-signature header')
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed')
    })

    const response = await POST(createWebhookRequest('{"id":"evt_test"}'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid signature')
  })

  it('returns 200 for valid checkout.session.completed event', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { supabase_user_id: 'user-123' },
          customer: 'cus_test',
          subscription: null,
        },
      },
    })
    mockAdminSingle.mockResolvedValue({ data: null, error: null })

    const response = await POST(createWebhookRequest('{"id":"evt_test"}'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })

  it('returns 200 for subscription.updated event', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test',
          metadata: { supabase_user_id: 'user-123' },
          customer: 'cus_test',
          status: 'active',
          items: {
            data: [{
              price: { id: 'price_core_monthly' },
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            }],
          },
        },
      },
    })
    mockAdminSingle.mockResolvedValue({ data: null, error: null })

    const response = await POST(createWebhookRequest('{"id":"evt_sub_update"}'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })

  it('returns 200 for unknown event types (no-op)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    })

    const response = await POST(createWebhookRequest('{"id":"evt_unknown"}'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })

  it('returns 500 when webhook secret is not configured', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')

    const response = await POST(createWebhookRequest('{"id":"evt_test"}'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Webhook secret not configured')

    // Restore
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret')
  })

  it('calls constructEvent with raw body and correct params', async () => {
    const rawBody = '{"id":"evt_test_raw"}'
    mockConstructEvent.mockReturnValue({
      type: 'charge.succeeded',
      data: { object: {} },
    })

    await POST(createWebhookRequest(rawBody, 'sig_test_123'))

    expect(mockConstructEvent).toHaveBeenCalledOnce()
    const [body, sig, secret] = mockConstructEvent.mock.calls[0]
    // Body should be a Buffer
    expect(Buffer.isBuffer(body)).toBe(true)
    expect(body.toString()).toBe(rawBody)
    expect(sig).toBe('sig_test_123')
    expect(secret).toBe('whsec_test_secret')
  })
})
