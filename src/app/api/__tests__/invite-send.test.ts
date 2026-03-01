import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TEST_USER } from './helpers'

// ── Hoisted mocks ───────────────────────────────────────────────────────

const {
  mockGetAuthenticatedUser,
  mockMembershipSingle,
  mockOrgSingle,
  mockInviteSingle,
  mockFetch,
} = vi.hoisted(() => {
  // Set env vars in hoisted block so they're available when the route module loads
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.NEXT_PUBLIC_BASE_URL = 'https://hookahtorus.com'
  process.env.RESEND_API_KEY = 'test-resend-key'

  const _mockFetch = vi.fn()
  globalThis.fetch = _mockFetch

  return {
    mockGetAuthenticatedUser: vi.fn(),
    mockMembershipSingle: vi.fn(),
    mockOrgSingle: vi.fn(),
    mockInviteSingle: vi.fn(),
    mockFetch: _mockFetch,
  }
})

vi.mock('@/lib/supabase/apiAuth', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}))

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, resetIn: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimits: { strict: { interval: 60000, maxRequests: 10 } },
  rateLimitExceeded: vi.fn().mockImplementation((resetIn: number) => {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(resetIn / 1000)) } },
    )
  }),
}))

let singleCallCount = 0

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        singleCallCount++
        if (singleCallCount === 1) return mockMembershipSingle()
        if (singleCallCount === 2) return mockOrgSingle()
        return mockInviteSingle()
      }),
    }
    return { from: vi.fn().mockReturnValue(builder) }
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '@/app/api/invite/send/route'

// ── Helpers ─────────────────────────────────────────────────────────────

function createInviteRequest(body: unknown) {
  return new Request('http://localhost/api/invite/send', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as Parameters<typeof POST>[0]
}

const VALID_BODY = {
  email: 'invite@example.com',
  role: 'manager' as const,
  organizationId: '550e8400-e29b-41d4-a716-446655440000',
}

/** Set up mocks for a full success path (membership → org → invite → Resend) */
function setupSuccessPath(memberRole = 'owner') {
  mockMembershipSingle.mockResolvedValue({ data: { role: memberRole }, error: null })
  mockOrgSingle.mockResolvedValue({ data: { name: 'Test Lounge' }, error: null })
  mockInviteSingle.mockResolvedValue({ data: { token: 'test-invite-token-123' }, error: null })
  mockFetch.mockResolvedValue({ ok: true })
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('/api/invite/send POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    singleCallCount = 0

    // Default: authenticated user
    mockGetAuthenticatedUser.mockResolvedValue({
      user: TEST_USER,
      response: null,
    })
  })

  it('returns 401 when not authenticated', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
    mockGetAuthenticatedUser.mockResolvedValue({
      user: null,
      response: mockResponse,
    })

    const response = await POST(createInviteRequest(VALID_BODY))

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost/api/invite/send', {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    }) as Parameters<typeof POST>[0]

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid JSON')
  })

  it('returns 400 when validation fails', async () => {
    const response = await POST(createInviteRequest({
      email: 'not-an-email',
      role: 'superadmin',
      organizationId: 'not-a-uuid',
    }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('returns 403 when user is not owner/manager of org', async () => {
    mockMembershipSingle.mockResolvedValue({
      data: { role: 'bartender' },
      error: null,
    })

    const response = await POST(createInviteRequest(VALID_BODY))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('returns 403 when manager tries to invite owner', async () => {
    mockMembershipSingle.mockResolvedValue({
      data: { role: 'manager' },
      error: null,
    })

    const response = await POST(createInviteRequest({
      ...VALID_BODY,
      role: 'owner',
    }))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Managers cannot invite owners')
  })

  it('returns 404 when no pending invite token exists', async () => {
    mockMembershipSingle.mockResolvedValue({ data: { role: 'owner' }, error: null })
    mockOrgSingle.mockResolvedValue({ data: { name: 'Test Lounge' }, error: null })
    mockInviteSingle.mockResolvedValue({ data: null, error: null })

    const response = await POST(createInviteRequest(VALID_BODY))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No invite found')
  })

  it('returns 200 and sends email on success', async () => {
    setupSuccessPath()

    const response = await POST(createInviteRequest(VALID_BODY))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('returns 502 when Resend API fails', async () => {
    setupSuccessPath()
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const response = await POST(createInviteRequest(VALID_BODY))
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.error).toBe('Failed to send email')
  })

  it('includes join URL and org name in email payload', async () => {
    setupSuccessPath()

    await POST(createInviteRequest(VALID_BODY))

    const [, fetchOptions] = mockFetch.mock.calls[0]
    const emailBody = JSON.parse(fetchOptions.body)

    expect(emailBody.to).toBe('invite@example.com')
    expect(emailBody.from).toContain('noreply@hookahtorus.com')
    expect(emailBody.html).toContain('test-invite-token-123')
    expect(emailBody.html).toContain('Test Lounge')
  })
})
