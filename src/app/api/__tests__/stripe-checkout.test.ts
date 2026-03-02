import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockStripeCheckoutCreate, mockGetSupabaseAdmin } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://hookahtorus.com'
  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockStripeCheckoutCreate: vi.fn(),
    mockGetSupabaseAdmin: vi.fn(),
  }
})

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: { create: (...args: unknown[]) => mockStripeCheckoutCreate(...args) },
    },
  },
  STRIPE_PRICES: {
    CORE_MONTHLY: 'price_core_monthly',
    CORE_YEARLY: 'price_core_yearly',
    MULTI_MONTHLY: 'price_multi_monthly',
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}))

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimits: { strict: { interval: 60000, maxRequests: 10 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
    })
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '@/app/api/stripe/checkout/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0]
}

function makeMockAdmin(profileData: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue({ data: profileData, error: null }),
  }
  return { from: vi.fn().mockReturnValue(builder) }
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
    mockStripeCheckoutCreate.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/abc' })
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({ stripe_customer_id: null }))
  })

  it('returns 401 when unauthenticated', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mockGetAuthenticatedUser.mockResolvedValue({ response: authResponse, user: null })
    const res = await POST(makeRequest({ priceId: 'price_core_monthly', userId: TEST_USER.id, email: 'test@example.com' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when userId does not match user (IDOR)', async () => {
    const res = await POST(makeRequest({ priceId: 'price_core_monthly', userId: '660e8400-e29b-41d4-a716-446655440001', email: 'test@example.com' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid priceId', async () => {
    const res = await POST(makeRequest({ priceId: 'price_invalid', userId: TEST_USER.id, email: 'test@example.com' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Invalid price')
  })

  it('creates subscription checkout for new customer', async () => {
    const res = await POST(makeRequest({ priceId: 'price_core_monthly', userId: TEST_USER.id, email: 'test@example.com' }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.sessionId).toBe('cs_test_123')
    expect(json.url).toBe('https://checkout.stripe.com/abc')
    const callArgs = mockStripeCheckoutCreate.mock.calls[0][0]
    expect(callArgs.mode).toBe('subscription')
    expect(callArgs.customer).toBeUndefined()
  })

  it('reuses existing Stripe customer ID for returning customer', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({ stripe_customer_id: 'cus_existing' }))
    await POST(makeRequest({ priceId: 'price_core_monthly', userId: TEST_USER.id, email: 'test@example.com' }))
    const callArgs = mockStripeCheckoutCreate.mock.calls[0][0]
    expect(callArgs.customer).toBe('cus_existing')
    expect(callArgs.customer_update).toEqual({ name: 'auto', address: 'auto' })
  })

  it('includes metadata with supabase_user_id', async () => {
    await POST(makeRequest({ priceId: 'price_core_monthly', userId: TEST_USER.id, email: 'test@example.com' }))
    const callArgs = mockStripeCheckoutCreate.mock.calls[0][0]
    expect(callArgs.metadata.supabase_user_id).toBe(TEST_USER.id)
    expect(callArgs.subscription_data.metadata.supabase_user_id).toBe(TEST_USER.id)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makeRequest({ priceId: 'price_core_monthly', userId: TEST_USER.id }))
    expect(res.status).toBe(429)
  })
})
