import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

const { mockGetAuthenticatedUser, mockDecrypt, mockDeleteWebhook, mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockDecrypt: vi.fn(),
  mockDeleteWebhook: vi.fn(),
  mockGetSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}))

vi.mock('@/lib/ready2order/crypto', () => ({
  decrypt: (...args: unknown[]) => mockDecrypt(...args),
}))

vi.mock('@/lib/ready2order/client', () => ({
  deleteWebhook: (...args: unknown[]) => mockDeleteWebhook(...args),
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

import { POST } from '@/app/api/r2o/disconnect/route'

function makeRequest() {
  return new Request('http://localhost/api/r2o/disconnect', { method: 'POST' }) as Parameters<typeof POST>[0]
}

function makeMockAdmin(connectionData: unknown = null) {
  let callCount = 0
  const builder = {
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return { data: connectionData, error: null }
      return { data: null, error: null }
    }),
    then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
  }
  return { from: vi.fn().mockReturnValue(builder), _builder: builder }
}

describe('POST /api/r2o/disconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthenticatedUser.mockResolvedValue({ user: TEST_USER })
    mockDecrypt.mockReturnValue('decrypted-token')
    mockDeleteWebhook.mockResolvedValue(undefined)
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

  it('disconnects with webhook deregistration', async () => {
    const admin = makeMockAdmin({
      encrypted_token: 'enc-token',
      token_iv: 'iv-123',
      webhook_registered: true,
    })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    const res = await POST(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.disconnected).toBe(true)
    expect(mockDecrypt).toHaveBeenCalledWith('enc-token', 'iv-123')
    expect(mockDeleteWebhook).toHaveBeenCalledWith('decrypted-token')
  })

  it('disconnects without webhook when not registered', async () => {
    const admin = makeMockAdmin({
      encrypted_token: 'enc-token',
      token_iv: 'iv-123',
      webhook_registered: false,
    })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    const res = await POST(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.disconnected).toBe(true)
    expect(mockDeleteWebhook).not.toHaveBeenCalled()
  })

  it('succeeds even when webhook deletion fails', async () => {
    const admin = makeMockAdmin({
      encrypted_token: 'enc-token',
      token_iv: 'iv-123',
      webhook_registered: true,
    })
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockDeleteWebhook.mockRejectedValue(new Error('R2O unavailable'))

    const res = await POST(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.disconnected).toBe(true)
  })

  it('disconnects when no connection exists', async () => {
    const admin = makeMockAdmin(null)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    const res = await POST(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.disconnected).toBe(true)
    expect(mockDeleteWebhook).not.toHaveBeenCalled()
  })
})
