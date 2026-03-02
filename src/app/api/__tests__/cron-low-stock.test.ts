import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreateClient, mockSendPushToUser, mockIsPushConfigured } = vi.hoisted(() => {
  process.env.CRON_SECRET = 'test-cron-secret'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  return {
    mockCreateClient: vi.fn(),
    mockSendPushToUser: vi.fn(),
    mockIsPushConfigured: { value: true },
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('@/lib/push/server', () => ({
  sendPushToUser: (...args: unknown[]) => mockSendPushToUser(...args),
  get isPushConfigured() { return mockIsPushConfigured.value },
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
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

import { GET } from '@/app/api/cron/low-stock/route'

function makeRequest(cronSecret = 'test-cron-secret') {
  return new Request('http://localhost/api/cron/low-stock', {
    headers: { authorization: `Bearer ${cronSecret}` },
  }) as Parameters<typeof GET>[0]
}

function makeMockSupabase(options: {
  settings?: unknown[]
  items?: unknown[]
  queryError?: unknown
} = {}) {
  let fromCallCount = 0
  const builder = {
    select: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => {
      fromCallCount++
      if (fromCallCount === 1) return resolve({ data: options.settings ?? [], error: null })
      return resolve({ data: options.items ?? [], error: options.queryError ?? null })
    },
  }
  return { from: vi.fn().mockReturnValue(builder) }
}

describe('GET /api/cron/low-stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPushConfigured.value = true
    mockSendPushToUser.mockResolvedValue(1)
  })

  it('returns 401 when cron secret is wrong', async () => {
    const res = await GET(makeRequest('wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns push not configured when push is disabled', async () => {
    mockIsPushConfigured.value = false
    const res = await GET(makeRequest())
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.message).toBe('Push not configured')
  })

  it('returns sent:0 when no items below threshold', async () => {
    const supabase = makeMockSupabase({
      items: [
        { profile_id: 'user-1', brand: 'Darkside', flavor: 'Grape', quantity_grams: 200 },
      ],
    })
    mockCreateClient.mockReturnValue(supabase)
    const res = await GET(makeRequest())
    const json = await res.json()
    expect(json.sent).toBe(0)
  })

  it('sends push for profiles with low stock items', async () => {
    const supabase = makeMockSupabase({
      items: [
        { profile_id: 'user-1', brand: 'Darkside', flavor: 'Grape', quantity_grams: 30 },
        { profile_id: 'user-1', brand: 'Tangiers', flavor: 'Mint', quantity_grams: 10 },
      ],
    })
    mockCreateClient.mockReturnValue(supabase)
    const res = await GET(makeRequest())
    const json = await res.json()
    expect(json.sent).toBe(1)
    expect(json.profiles).toBe(1)
    expect(mockSendPushToUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'Low stock: 2 items',
      tag: 'low-stock-daily',
      url: '/inventory',
    }))
  })

  it('respects custom per-profile threshold', async () => {
    const supabase = makeMockSupabase({
      settings: [{ profile_id: 'user-1', low_stock_threshold: 100 }],
      items: [
        { profile_id: 'user-1', brand: 'Darkside', flavor: 'Grape', quantity_grams: 80 },
      ],
    })
    mockCreateClient.mockReturnValue(supabase)
    const res = await GET(makeRequest())
    const json = await res.json()
    expect(json.sent).toBe(1)
    expect(json.profiles).toBe(1)
  })

  it('continues sending even if one push fails', async () => {
    const supabase = makeMockSupabase({
      items: [
        { profile_id: 'user-1', brand: 'Darkside', flavor: 'Grape', quantity_grams: 30 },
        { profile_id: 'user-2', brand: 'Tangiers', flavor: 'Mint', quantity_grams: 10 },
      ],
    })
    mockCreateClient.mockReturnValue(supabase)
    mockSendPushToUser
      .mockRejectedValueOnce(new Error('Push failed'))
      .mockResolvedValueOnce(1)
    const res = await GET(makeRequest())
    const json = await res.json()
    expect(json.sent).toBe(1)
    expect(json.profiles).toBe(2)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false, remaining: 0, resetIn: 5000 })
    const res = await GET(makeRequest())
    expect(res.status).toBe(429)
  })
})
