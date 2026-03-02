import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

// ── Hoisted mocks ───────────────────────────────────────────────────────

const {
  mockGetAuthenticatedUser,
  mockStripeCancel,
  mockProfileSingle,
  mockDeleteUser,
} = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockStripeCancel: vi.fn(),
    mockProfileSingle: vi.fn(),
    mockDeleteUser: vi.fn(),
  }
})

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
    }),
  ),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: { subscriptions: { cancel: (...args: unknown[]) => mockStripeCancel(...args) } },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockProfileSingle,
    }
    return {
      from: vi.fn().mockReturnValue(qb),
      auth: { admin: { deleteUser: mockDeleteUser } },
    }
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '@/app/api/account/delete/route'

// ── Helpers ─────────────────────────────────────────────────────────────

function createDeleteRequest(body: unknown) {
  return new Request('http://localhost/api/account/delete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as Parameters<typeof POST>[0]
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('/api/account/delete POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER, response: null })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    })

    const response = await POST(createDeleteRequest({ confirmation: 'DELETE' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/account/delete', {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid JSON')
  })

  it('returns 400 when confirmation is not DELETE', async () => {
    const response = await POST(createDeleteRequest({ confirmation: 'WRONG' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid confirmation')
  })

  it('returns 200 and cancels Stripe subscription when present', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { stripe_subscription_id: 'sub_123', stripe_customer_id: 'cus_123' },
      error: null,
    })
    mockStripeCancel.mockResolvedValue({})
    mockDeleteUser.mockResolvedValue({ error: null })

    const response = await POST(createDeleteRequest({ confirmation: 'DELETE' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockStripeCancel).toHaveBeenCalledWith('sub_123')
    expect(mockDeleteUser).toHaveBeenCalledWith(TEST_USER.id)
  })

  it('returns 200 without calling Stripe when no subscription', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { stripe_subscription_id: null, stripe_customer_id: null },
      error: null,
    })
    mockDeleteUser.mockResolvedValue({ error: null })

    const response = await POST(createDeleteRequest({ confirmation: 'DELETE' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockStripeCancel).not.toHaveBeenCalled()
  })

  it('still deletes account when Stripe cancellation fails', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { stripe_subscription_id: 'sub_fail', stripe_customer_id: 'cus_fail' },
      error: null,
    })
    mockStripeCancel.mockRejectedValue(new Error('Stripe error'))
    mockDeleteUser.mockResolvedValue({ error: null })

    const response = await POST(createDeleteRequest({ confirmation: 'DELETE' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDeleteUser).toHaveBeenCalled()
  })

  it('returns 500 when account deletion fails', async () => {
    mockProfileSingle.mockResolvedValue({
      data: { stripe_subscription_id: null, stripe_customer_id: null },
      error: null,
    })
    mockDeleteUser.mockResolvedValue({ error: new Error('Delete failed') })

    const response = await POST(createDeleteRequest({ confirmation: 'DELETE' }))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete account')
  })
})
