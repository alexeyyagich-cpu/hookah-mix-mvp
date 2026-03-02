import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockConstructEvent, mockGetSupabaseAdmin, mockAdminFrom } = vi.hoisted(() => {
  process.env.STRIPE_TIP_WEBHOOK_SECRET = 'whsec_test_tip_secret'
  return {
    mockConstructEvent: vi.fn(),
    mockGetSupabaseAdmin: vi.fn(),
    mockAdminFrom: vi.fn(),
  }
})

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '@/app/api/tip/webhook/route'

function makeRequest(body = '{}', signature = 'sig_test') {
  return new Request('http://localhost/api/tip/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body,
  }) as Parameters<typeof POST>[0]
}

function makeTipEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        metadata: { type: 'tip', staff_profile_id: 'staff-123', payer_name: 'John', message: 'Thanks!' },
        amount_total: 500,
        currency: 'eur',
        payment_intent: 'pi_test_123',
        ...overrides,
      },
    },
  }
}

function makeMockAdmin(options: { existing?: unknown; insertError?: unknown } = {}) {
  let fromCallCount = 0
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) return { data: options.existing ?? null, error: null }
      return { data: null, error: null }
    }),
    then: (resolve: (v: unknown) => void) => resolve({ data: null, error: options.insertError ?? null }),
  }
  return { from: vi.fn().mockReturnValue(builder) }
}

describe('POST /api/tip/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when signature is missing', async () => {
    const req = new Request('http://localhost/api/tip/webhook', {
      method: 'POST',
      body: '{}',
    }) as Parameters<typeof POST>[0]
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature') })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns received:true for non-checkout events', async () => {
    mockConstructEvent.mockReturnValue({ type: 'payment_intent.created', data: {} })
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
  })

  it('returns received:true for non-tip checkout sessions', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { metadata: { type: 'subscription' } } },
    })
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(json.received).toBe(true)
  })

  it('skips duplicate payment intents (idempotency)', async () => {
    mockConstructEvent.mockReturnValue(makeTipEvent())
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({ existing: { id: 'existing-tip' } }))
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(json.received).toBe(true)
  })

  it('inserts tip on successful checkout', async () => {
    mockConstructEvent.mockReturnValue(makeTipEvent())
    const admin = makeMockAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
    expect(admin.from).toHaveBeenCalledWith('tips')
  })

  it('returns received:true when staffProfileId is missing', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { type: 'tip' },
          amount_total: 500,
          payment_intent: 'pi_test',
        },
      },
    })
    const admin = makeMockAdmin()
    mockGetSupabaseAdmin.mockReturnValue(admin)
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(json.received).toBe(true)
  })
})
