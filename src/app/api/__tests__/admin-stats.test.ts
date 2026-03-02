import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

// ── Hoisted mocks ───────────────────────────────────────────────────────

const { mockGetAdminUser, mockFrom } = vi.hoisted(() => ({
  mockGetAdminUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAdminUser: (...args: unknown[]) => mockGetAdminUser(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  rateLimits: { standard: { interval: 60000, maxRequests: 100 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) =>
    new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) },
    }),
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { GET } from '@/app/api/admin/stats/route'

// ── Helpers ─────────────────────────────────────────────────────────────

function createRequest() {
  return new Request('http://localhost/api/admin/stats', {
    method: 'GET',
    headers: { authorization: 'Bearer test-jwt-token' },
  })
}

function buildMockAdminClient() {
  const client = { from: mockFrom }
  return client
}

function makeThenable(resolved: { data?: unknown; error?: unknown; count?: number | null }) {
  const qb: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'gte', 'order', 'in', 'single', 'head']
  for (const m of methods) {
    qb[m] = vi.fn().mockReturnValue(qb)
  }
  qb.then = (resolve: (v: typeof resolved) => void) => resolve(resolved)
  return qb
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('/api/admin/stats GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: null,
      adminClient: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    })

    const response = await GET(createRequest())
    expect(response.status).toBe(401)
  })

  it('returns 403 when not superadmin', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: null,
      adminClient: null,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    })

    const response = await GET(createRequest())
    expect(response.status).toBe(403)
  })

  it('returns 200 with correct metric shape', async () => {
    const now = new Date()
    const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER,
      adminClient: buildMockAdminClient(),
      response: null,
    })

    let fromCallCount = 0
    mockFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // organizations query
        return makeThenable({
          data: [
            { id: '1', subscription_tier: 'core', trial_expires_at: null, subscription_expires_at: null, created_at: recentDate },
            { id: '2', subscription_tier: 'trial', trial_expires_at: now.toISOString(), subscription_expires_at: null, created_at: recentDate },
            { id: '3', subscription_tier: 'multi', trial_expires_at: null, subscription_expires_at: null, created_at: '2024-01-01T00:00:00Z' },
          ],
          error: null,
        })
      }
      if (fromCallCount === 2) {
        // sessions count
        return makeThenable({ data: null, error: null, count: 5 })
      }
      // profiles count
      return makeThenable({ data: null, error: null, count: 10 })
    })

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('total_orgs', 3)
    expect(data).toHaveProperty('mrr')
    expect(data.mrr).toBe(79 + 149) // 1 core + 1 multi
    expect(data).toHaveProperty('orgs_by_tier')
    expect(data.orgs_by_tier).toEqual({ trial: 1, core: 1, multi: 1, enterprise: 0 })
    expect(data).toHaveProperty('active_orgs_7d', 5)
    expect(data).toHaveProperty('total_users', 10)
    expect(data).toHaveProperty('recent_signups_30d')
    expect(data).toHaveProperty('trials_expiring_7d')
    expect(data).toHaveProperty('trial_to_paid_rate')
  })

  it('handles empty org list gracefully', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER,
      adminClient: buildMockAdminClient(),
      response: null,
    })

    let fromCallCount = 0
    mockFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) return makeThenable({ data: [], error: null })
      return makeThenable({ data: null, error: null, count: 0 })
    })

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.total_orgs).toBe(0)
    expect(data.mrr).toBe(0)
    expect(data.total_users).toBe(0)
  })

  it('returns 500 on query error', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER,
      adminClient: buildMockAdminClient(),
      response: null,
    })

    mockFrom.mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal error')
  })
})
