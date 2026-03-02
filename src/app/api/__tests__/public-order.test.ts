import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ───────────────────────────────────────────────────────

const { mockSingle, mockMaybeSingle, mockInsertSingle } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

  return {
    mockSingle: vi.fn(),
    mockMaybeSingle: vi.fn(),
    mockInsertSingle: vi.fn(),
  }
})

let fromCallCount = 0

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        fromCallCount++
        // Call 1: profiles (venue lookup)
        if (fromCallCount === 1) return mockSingle()
        // Call 2: floor_tables (from Promise.all)
        if (fromCallCount === 2) return mockSingle()
        // Call 4: kds_orders insert .single()
        return mockInsertSingle()
      }),
      maybeSingle: vi.fn().mockImplementation(() => {
        // Call 3: recent order check (from Promise.all)
        return mockMaybeSingle()
      }),
    }
    return { from: vi.fn().mockReturnValue(builder) }
  }),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
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

import { POST } from '@/app/api/public/order/[slug]/route'

// ── Helpers ─────────────────────────────────────────────────────────────

function createOrderRequest(slug: string, body: unknown) {
  const request = new Request(`http://localhost/api/public/order/${slug}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as Parameters<typeof POST>[0]
  return request
}

function callPost(slug: string, body: unknown) {
  return POST(createOrderRequest(slug, body), { params: Promise.resolve({ slug }) })
}

const VALID_BODY = {
  table_id: 'table-uuid-1',
  type: 'bar' as const,
  items: [{ name: 'Mojito', quantity: 1 }],
}

function setupSuccess() {
  // profiles → found
  mockSingle
    .mockResolvedValueOnce({ data: { id: 'profile-1' }, error: null })
    // floor_tables → found
    .mockResolvedValueOnce({ data: { id: 'table-uuid-1', name: 'Table 1' }, error: null })
  // No recent orders
  mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
  // Insert success
  mockInsertSingle.mockResolvedValueOnce({ data: { id: 'order-1' }, error: null })
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('/api/public/order/[slug] POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromCallCount = 0
  })

  it('returns 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/public/order/test-venue', {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    }) as Parameters<typeof POST>[0]

    const response = await POST(request, { params: Promise.resolve({ slug: 'test-venue' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid JSON')
  })

  it('returns 400 for invalid slug', async () => {
    const response = await callPost('INVALID SLUG!', VALID_BODY)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid slug')
  })

  it('returns 400 for validation failure (missing items)', async () => {
    const response = await callPost('test-venue', { table_id: 'x', type: 'bar', items: [] })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('returns 404 when venue slug not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

    const response = await callPost('no-venue', VALID_BODY)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Venue not found')
  })

  it('returns 400 when table not found', async () => {
    // Profile found
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'profile-1' }, error: null })
      // Table not found
      .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const response = await callPost('test-venue', VALID_BODY)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Table not found')
  })

  it('returns 429 when cooldown is active', async () => {
    // Profile found
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'profile-1' }, error: null })
      // Table found
      .mockResolvedValueOnce({ data: { id: 'table-uuid-1', name: 'Table 1' }, error: null })
    // Recent order just now
    mockMaybeSingle.mockResolvedValueOnce({
      data: { created_at: new Date().toISOString() },
      error: null,
    })

    const response = await callPost('test-venue', VALID_BODY)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Rate limited')
    expect(data.retry_after).toBeGreaterThan(0)
  })

  it('returns 200 and creates order on success', async () => {
    setupSuccess()

    const response = await callPost('test-venue', VALID_BODY)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.orderId).toBe('order-1')
  })

  it('returns 500 when insert fails', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'profile-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'table-uuid-1', name: 'Table 1' }, error: null })
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockInsertSingle.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') })

    const response = await callPost('test-venue', VALID_BODY)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create order')
  })
})
