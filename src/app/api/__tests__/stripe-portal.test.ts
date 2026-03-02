import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockStripePortalCreate, mockGetSupabaseAdmin } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://hookahtorus.com'
  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockStripePortalCreate: vi.fn(),
    mockGetSupabaseAdmin: vi.fn(),
  }
})

vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: { create: (...args: unknown[]) => mockStripePortalCreate(...args) },
    },
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

import { POST } from '@/app/api/stripe/portal/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/stripe/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0]
}

function makeMockAdmin(profileData: unknown = null, profileError: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue({ data: profileData, error: profileError }),
  }
  return { from: vi.fn().mockReturnValue(builder) }
}

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
    mockStripePortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session/abc' })
  })

  it('returns 401 when unauthenticated', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mockGetAuthenticatedUser.mockResolvedValue({ response: authResponse, user: null })
    const res = await POST(makeRequest({ userId: TEST_USER.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when userId does not match authenticated user (IDOR)', async () => {
    const res = await POST(makeRequest({ userId: '660e8400-e29b-41d4-a716-446655440001' }))
    expect(res.status).toBe(403)
  })

  it('returns 404 when no stripe_customer_id found', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin(null))
    const res = await POST(makeRequest({ userId: TEST_USER.id }))
    expect(res.status).toBe(404)
  })

  it('returns 404 when stripe_customer_id is empty', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({ stripe_customer_id: null }))
    const res = await POST(makeRequest({ userId: TEST_USER.id }))
    expect(res.status).toBe(404)
  })

  it('returns portal URL on success', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({ stripe_customer_id: 'cus_abc123' }))
    const res = await POST(makeRequest({ userId: TEST_USER.id }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.url).toBe('https://billing.stripe.com/session/abc')
    expect(mockStripePortalCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_abc123',
      locale: 'auto',
    }))
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makeRequest({ userId: TEST_USER.id }))
    expect(res.status).toBe(429)
  })
})
