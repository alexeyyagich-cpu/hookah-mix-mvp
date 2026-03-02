import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetSupabaseAdmin } = vi.hoisted(() => {
  process.env.R2O_WEBHOOK_SECRET = 'test-webhook-secret'
  return {
    mockGetSupabaseAdmin: vi.fn(),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '@/app/api/r2o/webhooks/route'

// The route uses request.nextUrl which is Next.js-specific, so we add it to plain Request
function makeRequest(body: unknown, secret = 'test-webhook-secret') {
  const url = `http://localhost/api/r2o/webhooks?secret=${encodeURIComponent(secret)}`
  const req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // Polyfill nextUrl for NextRequest compatibility
  Object.defineProperty(req, 'nextUrl', { value: new URL(url), writable: false })
  return req as Parameters<typeof POST>[0]
}

function makeInvalidJsonRequest(secret = 'test-webhook-secret') {
  const url = `http://localhost/api/r2o/webhooks?secret=${encodeURIComponent(secret)}`
  const req = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'invalid-json',
  })
  Object.defineProperty(req, 'nextUrl', { value: new URL(url), writable: false })
  return req as Parameters<typeof POST>[0]
}

function makeMockSupabase(options: {
  connection?: unknown
  existingCount?: number
  mappings?: unknown[]
} = {}) {
  let fromCallCount = 0
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) return { data: options.connection ?? null, error: null }
      return { data: null, error: null }
    }),
    head: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => {
      fromCallCount++
      if (fromCallCount === 2) return resolve({ count: options.existingCount ?? 0, data: null, error: null })
      if (fromCallCount === 3) return resolve({ data: options.mappings ?? [], error: null })
      return resolve({ data: null, error: null })
    },
  }

  return {
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _builder: builder,
    _resetCount: () => { fromCallCount = 0 },
  }
}

describe('POST /api/r2o/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when secret does not match', async () => {
    const res = await POST(makeRequest({ event: 'invoice.created', accountId: '123' }, 'wrong-secret-value'))
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid JSON', async () => {
    const res = await POST(makeInvalidJsonRequest())
    expect(res.status).toBe(400)
  })

  it('returns 400 when missing event or accountId', async () => {
    const supabase = makeMockSupabase()
    mockGetSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeRequest({ event: 'invoice.created' }))
    expect(res.status).toBe(400)
  })

  it('returns received:true when no connection found', async () => {
    const supabase = makeMockSupabase({ connection: null })
    mockGetSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeRequest({ event: 'invoice.created', accountId: 'unknown-123' }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
  })

  it('returns received:true for non-invoice events', async () => {
    const supabase = makeMockSupabase({ connection: { profile_id: 'user-123' } })
    mockGetSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeRequest({ event: 'product.updated', accountId: 'acc-123' }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
  })

  it('returns received:true when invoice_id is missing', async () => {
    const supabase = makeMockSupabase({ connection: { profile_id: 'user-123' } })
    mockGetSupabaseAdmin.mockReturnValue(supabase)
    const res = await POST(makeRequest({
      event: 'invoice.created',
      accountId: 'acc-123',
      data: { invoice_number: 'INV-1' },
    }))
    const json = await res.json()
    expect(json.received).toBe(true)
  })
})
