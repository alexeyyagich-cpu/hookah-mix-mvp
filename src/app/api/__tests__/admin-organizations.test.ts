import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

// ── Hoisted mocks ───────────────────────────────────────────────────────

const { mockGetAdminUser, mockFrom } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'https://hookahtorus.com'

  return {
    mockGetAdminUser: vi.fn(),
    mockFrom: vi.fn(),
  }
})

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAdminUser: (...args: unknown[]) => mockGetAdminUser(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  rateLimits: { standard: { interval: 60000, maxRequests: 100 }, strict: { interval: 60000, maxRequests: 10 } },
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

import { GET, PATCH } from '@/app/api/admin/organizations/route'

// ── Helpers ─────────────────────────────────────────────────────────────

function createGetRequest() {
  return new Request('http://localhost/api/admin/organizations', {
    method: 'GET',
    headers: { authorization: 'Bearer test-jwt' },
  })
}

function createPatchRequest(body: unknown, origin = 'https://hookahtorus.com') {
  return new Request('http://localhost/api/admin/organizations', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer test-jwt',
      'origin': origin,
    },
  }) as Parameters<typeof PATCH>[0]
}

function buildMockAdminClient() {
  return { from: mockFrom }
}

function makeThenable(resolved: { data?: unknown; error?: unknown; count?: number | null }) {
  const qb: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'in', 'order', 'update', 'single', 'head']
  for (const m of methods) {
    qb[m] = vi.fn().mockReturnValue(qb)
  }
  qb.then = (resolve: (v: typeof resolved) => void) => resolve(resolved)
  return qb
}

const VALID_PATCH_BODY = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  subscription_tier: 'core' as const,
}

// ── GET tests ───────────────────────────────────────────────────────────

describe('/api/admin/organizations GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: null, adminClient: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    })

    const response = await GET(createGetRequest())
    expect(response.status).toBe(401)
  })

  it('returns 403 when not superadmin', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: null, adminClient: null,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    })

    const response = await GET(createGetRequest())
    expect(response.status).toBe(403)
  })

  it('returns 200 with enriched org list', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    let fromCallCount = 0
    mockFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // organizations
        return makeThenable({
          data: [{ id: 'org1', name: 'Test Lounge', created_at: '2024-01-01' }],
          error: null,
        })
      }
      if (fromCallCount === 2) {
        // org_members
        return makeThenable({
          data: [{ organization_id: 'org1', user_id: 'u1', role: 'owner', display_name: 'Admin', is_active: true }],
          error: null,
        })
      }
      // locations
      return makeThenable({
        data: [{ id: 'loc1', organization_id: 'org1' }],
        error: null,
      })
    })

    const response = await GET(createGetRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      id: 'org1',
      name: 'Test Lounge',
      member_count: 1,
      location_count: 1,
      owner_name: 'Admin',
    })
  })

  it('handles empty results', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    mockFrom.mockImplementation(() => makeThenable({ data: [], error: null }))

    const response = await GET(createGetRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('returns 500 on query error', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    mockFrom.mockImplementation(() => makeThenable({ data: null, error: new Error('DB error') }))

    const response = await GET(createGetRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal error')
  })
})

// ── PATCH tests ─────────────────────────────────────────────────────────

describe('/api/admin/organizations PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: null, adminClient: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    })

    const response = await PATCH(createPatchRequest(VALID_PATCH_BODY))
    expect(response.status).toBe(401)
  })

  it('returns 403 for CSRF origin mismatch', async () => {
    // getAdminUser is called AFTER origin check, but rate limit + origin check come first
    // Actually looking at the code: rate limit → origin check → getAdminUser → parse body
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    const response = await PATCH(createPatchRequest(VALID_PATCH_BODY, 'https://evil.com'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('returns 400 for invalid JSON', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    const request = new Request('http://localhost/api/admin/organizations', {
      method: 'PATCH',
      body: 'not json',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer test-jwt',
        'origin': 'https://hookahtorus.com',
      },
    }) as Parameters<typeof PATCH>[0]

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid JSON')
  })

  it('returns 400 for validation failure', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    const response = await PATCH(createPatchRequest({
      id: 'not-a-uuid',
      subscription_tier: 'invalid_tier',
    }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('returns 200 and updates org on success', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    mockFrom.mockImplementation(() =>
      makeThenable({
        data: { id: VALID_PATCH_BODY.id, subscription_tier: 'core' },
        error: null,
      }),
    )

    const response = await PATCH(createPatchRequest(VALID_PATCH_BODY))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(VALID_PATCH_BODY.id)
    expect(data.subscription_tier).toBe('core')
  })

  it('returns 500 when update throws', async () => {
    mockGetAdminUser.mockResolvedValue({
      user: TEST_USER, adminClient: buildMockAdminClient(), response: null,
    })

    mockFrom.mockImplementation(() =>
      makeThenable({ data: null, error: new Error('Update failed') }),
    )

    const response = await PATCH(createPatchRequest(VALID_PATCH_BODY))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal error')
  })
})
