import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub env before route import
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock global fetch (health route fetches Supabase REST + Redis)
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { GET } from '@/app/api/health/route'

describe('/api/health GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok status when DB is reachable', async () => {
    // Supabase HEAD check returns ok
    mockFetch.mockResolvedValue({ ok: true, status: 200 })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.db).toBe(true)
    // Redis defaults to true when env vars not set
    expect(data.redis).toBe(true)
    expect(data.latency_ms).toBeTypeOf('number')
    expect(data.timestamp).toBeTruthy()
  })

  it('returns degraded when DB is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('degraded')
    expect(data.db).toBe(false)
  })

  it('returns degraded when DB returns non-ok and non-400 status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 })

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('degraded')
    expect(data.db).toBe(false)
  })

  it('treats DB 400 as reachable (API responds)', async () => {
    // 400 from Supabase REST means the API is up but request was bad
    mockFetch.mockResolvedValue({ ok: false, status: 400 })

    const response = await GET()
    const data = await response.json()

    expect(data.db).toBe(true)
  })

  it('checks Redis when env vars are set', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://test-redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-redis-token')

    // First call = Supabase, second call = Redis
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true })

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('ok')
    expect(data.db).toBe(true)
    expect(data.redis).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Clean up
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('always returns a valid JSON response', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('db')
    expect(data).toHaveProperty('redis')
    expect(data).toHaveProperty('latency_ms')
    expect(data).toHaveProperty('timestamp')
  })
})
