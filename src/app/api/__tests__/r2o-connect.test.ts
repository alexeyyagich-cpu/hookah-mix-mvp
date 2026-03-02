import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockGrantAccessToken, mockGetUserTier, mockHasFeatureAccess } = vi.hoisted(() => {
  process.env.R2O_DEVELOPER_TOKEN = 'test-developer-token'
  process.env.NEXT_PUBLIC_APP_URL = 'https://hookahtorus.com'
  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockGrantAccessToken: vi.fn(),
    mockGetUserTier: vi.fn(),
    mockHasFeatureAccess: vi.fn(),
  }
})

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

vi.mock('@/lib/ready2order/client', () => ({
  grantAccessToken: (...args: unknown[]) => mockGrantAccessToken(...args),
}))

vi.mock('@/lib/subscriptionGuard', () => ({
  getUserTier: (...args: unknown[]) => mockGetUserTier(...args),
  hasFeatureAccess: (...args: unknown[]) => mockHasFeatureAccess(...args),
  featureNotAvailable: vi.fn().mockImplementation((feature: string) =>
    new Response(JSON.stringify({ error: `Feature "${feature}" requires a higher subscription tier.` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  ),
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

import { POST } from '@/app/api/r2o/connect/route'

function makeRequest() {
  return new Request('http://localhost/api/r2o/connect', { method: 'POST' }) as Parameters<typeof POST>[0]
}

function makeMockSupabase(options: {
  profile?: unknown
  connection?: unknown
} = {}) {
  let singleCallCount = 0
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      singleCallCount++
      if (singleCallCount === 1) return { data: options.profile ?? null, error: null }
      return { data: options.connection ?? null, error: null }
    }),
  }
  return { from: vi.fn().mockReturnValue(builder) }
}

describe('POST /api/r2o/connect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const supabase = makeMockSupabase({
      profile: { subscription_tier: 'multi', subscription_expires_at: '2030-01-01T00:00:00Z' },
      connection: null,
    })
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER, supabase })
    mockGetUserTier.mockResolvedValue('multi')
    mockHasFeatureAccess.mockReturnValue(true)
    mockGrantAccessToken.mockResolvedValue({ grantAccessUri: 'https://r2o.example.com/grant/abc' })
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await POST(makeRequest())
    expect(res.status).toBe(429)
  })

  it('returns 401 when unauthenticated', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    mockGetAuthenticatedUser.mockResolvedValue({ response: authResponse, user: null })
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 when subscription tier insufficient', async () => {
    mockHasFeatureAccess.mockReturnValue(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 403 for trial subscription', async () => {
    const supabase = makeMockSupabase({
      profile: { subscription_tier: 'trial', subscription_expires_at: null },
      connection: null,
    })
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER, supabase })
    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
  })

  it('returns 409 when already connected', async () => {
    const supabase = makeMockSupabase({
      profile: { subscription_tier: 'multi', subscription_expires_at: '2030-01-01T00:00:00Z' },
      connection: { id: 'conn-1', status: 'connected' },
    })
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER, supabase })
    const res = await POST(makeRequest())
    expect(res.status).toBe(409)
  })

  it('returns grantAccessUri and sets r2o_state cookie on success', async () => {
    const res = await POST(makeRequest())
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.grantAccessUri).toBe('https://r2o.example.com/grant/abc')
    // Verify cookie is set
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('r2o_state=')
    expect(setCookie).toContain('HttpOnly')
  })
})
