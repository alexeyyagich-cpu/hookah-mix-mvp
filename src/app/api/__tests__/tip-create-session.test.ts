import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockStripeCheckoutCreate, mockGetSupabaseAdmin, mockStaffSingle } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://hookahtorus.com'
  return {
    mockStripeCheckoutCreate: vi.fn(),
    mockGetSupabaseAdmin: vi.fn(),
    mockStaffSingle: vi.fn(),
  }
})

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: { create: (...args: unknown[]) => mockStripeCheckoutCreate(...args) },
    },
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
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

import { POST } from '@/app/api/tip/create-session/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/tip/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0]
}

function makeMockAdmin(staffData: unknown = null, staffError: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue({ data: staffData, error: staffError }),
  }
  return { from: vi.fn().mockReturnValue(builder) }
}

const validBody = {
  staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
  amount: 5,
  currency: 'eur',
  payerName: 'John',
  message: 'Great service!',
  slug: 'john-doe',
}

describe('POST /api/tip/create-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session/abc' })
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(429)
  })

  it('returns 400 on invalid JSON body', async () => {
    const req = new Request('http://localhost/api/tip/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    }) as Parameters<typeof POST>[0]
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 on validation failure', async () => {
    const res = await POST(makeRequest({ amount: -1 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when staff profile not found', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin(null, { message: 'not found' }))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 404 when tips are disabled for staff', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin(null))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('creates Stripe checkout session and returns URL', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({
      id: validBody.staffProfileId,
      display_name: 'John Doe',
      is_tip_enabled: true,
    }))
    const res = await POST(makeRequest(validBody))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.url).toBe('https://checkout.stripe.com/session/abc')
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'payment',
      metadata: expect.objectContaining({ type: 'tip' }),
    }))
  })

  it('converts amount to cents correctly', async () => {
    mockGetSupabaseAdmin.mockReturnValue(makeMockAdmin({
      id: validBody.staffProfileId,
      display_name: 'John Doe',
      is_tip_enabled: true,
    }))
    await POST(makeRequest({ ...validBody, amount: 10.50 }))
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({ unit_amount: 1050 }),
      })],
    }))
  })
})
