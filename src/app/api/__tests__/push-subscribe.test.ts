import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockCreateClient } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockCreateClient: vi.fn(),
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimits: { webhook: { interval: 60000, maxRequests: 100 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
    })
  ),
}))

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

import { POST, DELETE } from '@/app/api/push/subscribe/route'

function makeMockSupabase() {
  const builder = {
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
  }
  return { from: vi.fn().mockReturnValue(builder), _builder: builder }
}

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Parameters<typeof POST>[0]
}

function makeDeleteRequest(body: unknown) {
  return new Request('http://localhost/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Parameters<typeof DELETE>[0]
}

const validSubscription = {
  subscription: {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  },
  profileId: TEST_USER.id,
}

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const supabase = makeMockSupabase()
    mockCreateClient.mockReturnValue(supabase)
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
  })

  it('returns 401 when unauthenticated', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mockGetAuthenticatedUser.mockResolvedValue({ response: authResponse, user: null })
    const res = await POST(makePostRequest(validSubscription))
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid body', async () => {
    const res = await POST(makePostRequest({ invalid: true }))
    expect(res.status).toBe(400)
  })

  it('returns 403 when profileId does not match user', async () => {
    const body = { ...validSubscription, profileId: '660e8400-e29b-41d4-a716-446655440001' }
    const res = await POST(makePostRequest(body))
    expect(res.status).toBe(403)
  })

  it('upserts subscription and returns ok', async () => {
    const res = await POST(makePostRequest(validSubscription))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makePostRequest(validSubscription))
    expect(res.status).toBe(429)
  })
})

describe('DELETE /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const supabase = makeMockSupabase()
    mockCreateClient.mockReturnValue(supabase)
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
  })

  it('returns 401 when unauthenticated', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mockGetAuthenticatedUser.mockResolvedValue({ response: authResponse, user: null })
    const res = await DELETE(makeDeleteRequest({ endpoint: 'https://example.com', profileId: TEST_USER.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when profileId does not match user', async () => {
    const res = await DELETE(makeDeleteRequest({ endpoint: 'https://example.com', profileId: '660e8400-e29b-41d4-a716-446655440001' }))
    expect(res.status).toBe(403)
  })

  it('deletes subscription and returns ok', async () => {
    const res = await DELETE(makeDeleteRequest({ endpoint: 'https://example.com', profileId: TEST_USER.id }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await DELETE(makeDeleteRequest({ endpoint: 'https://example.com', profileId: TEST_USER.id }))
    expect(res.status).toBe(429)
  })
})
