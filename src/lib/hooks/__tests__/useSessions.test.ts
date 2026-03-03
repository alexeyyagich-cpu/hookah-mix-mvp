import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before vi.mock calls
// ---------------------------------------------------------------------------
const { mockUseSupabaseList, mockApplyOrgFilter, mockEnqueue, mockGenerateTempId } = vi.hoisted(() => ({
  mockUseSupabaseList: vi.fn(),
  mockApplyOrgFilter: vi.fn((q: unknown) => q),
  mockEnqueue: vi.fn(),
  mockGenerateTempId: vi.fn(() => 'temp-id'),
}))

vi.mock('../useSupabaseList', () => ({ useSupabaseList: mockUseSupabaseList }))
vi.mock('../useOrgFilter', () => ({ applyOrgFilter: mockApplyOrgFilter }))
vi.mock('@/lib/offline/offlineMutation', () => ({ enqueueOfflineMutation: mockEnqueue, generateTempId: mockGenerateTempId }))
vi.mock('@/lib/utils/translateError', () => ({ translateError: vi.fn((e: Error) => e?.message || 'error') }))
vi.mock('@/lib/demo', () => ({ DEMO_SESSIONS: [] }))
vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'test-id', subscription_tier: 'core' } })),
}))

// ---------------------------------------------------------------------------
// Chainable Supabase query builder
// ---------------------------------------------------------------------------
function chainableQuery(result: { data?: unknown; error?: unknown }) {
  const q: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'is', 'in', 'gte', 'lte',
    'order', 'limit', 'range', 'single', 'maybeSingle',
  ]
  for (const m of methods) q[m] = vi.fn().mockReturnValue(q)
  // Thenable — resolves with { data, error } so `await query` works
  q.then = vi.fn((resolve: (v: unknown) => void) =>
    resolve({ data: result.data ?? null, error: result.error ?? null }),
  )
  return q
}

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------
let mockSetItems: ReturnType<typeof vi.fn>
let mockSetError: ReturnType<typeof vi.fn>
let mockRefresh: ReturnType<typeof vi.fn>
let mockFrom: ReturnType<typeof vi.fn>
let mockRpc: ReturnType<typeof vi.fn>

function setupDefaults(overrides: Record<string, unknown> = {}) {
  mockSetItems = vi.fn()
  mockSetError = vi.fn()
  mockRefresh = vi.fn()
  mockFrom = vi.fn().mockReturnValue(chainableQuery({ data: null }))
  mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })

  mockUseSupabaseList.mockReturnValue({
    items: [],
    setItems: mockSetItems,
    loading: false,
    error: null,
    setError: mockSetError,
    refresh: mockRefresh,
    supabase: { from: mockFrom, rpc: mockRpc },
    user: { id: 'test-id', email: 'test@test.com' },
    profile: { id: 'test-id', subscription_tier: 'core' },
    organizationId: null,
    locationId: null,
    isDemoMode: false,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// Import hook AFTER all vi.mock calls
// ---------------------------------------------------------------------------
import { useSessions } from '../useSessions'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  setupDefaults()
})

describe('useSessions', () => {
  // -------------------------------------------------------------------------
  // 1. Returns sessions from useSupabaseList
  // -------------------------------------------------------------------------
  it('returns sessions from useSupabaseList', () => {
    const fakeSessions = [
      { id: 's1', profile_id: 'test-id', session_date: '2026-03-01', total_grams: 20, session_items: [], bowl_type: null },
      { id: 's2', profile_id: 'test-id', session_date: '2026-03-02', total_grams: 30, session_items: [], bowl_type: null },
    ]
    setupDefaults({ items: fakeSessions })

    const { result } = renderHook(() => useSessions())
    expect(result.current.sessions).toBe(fakeSessions)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 2. createSession returns null when no user
  // -------------------------------------------------------------------------
  it('createSession returns null when no user', async () => {
    setupDefaults({ user: null })

    const { result } = renderHook(() => useSessions())

    let session: unknown
    await act(async () => {
      session = await result.current.createSession(
        { session_date: '2026-03-03', total_grams: 20, guest_id: null, bowl_type_id: null, compatibility_score: null, notes: null, rating: null, duration_minutes: null, selling_price: 25, created_by: null },
        [{ tobacco_inventory_id: 'inv-1', tobacco_id: 'tob-1', brand: 'Tangiers', flavor: 'Birquq', grams_used: 20, percentage: 100 }],
      )
    })

    expect(session).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 3. createSession in demo mode
  // -------------------------------------------------------------------------
  it('createSession in demo mode adds to local state', async () => {
    setupDefaults({ isDemoMode: true })

    const { result } = renderHook(() => useSessions())

    let session: unknown
    await act(async () => {
      session = await result.current.createSession(
        { session_date: '2026-03-03', total_grams: 20, guest_id: null, bowl_type_id: null, compatibility_score: null, notes: null, rating: null, duration_minutes: null, selling_price: 25, created_by: null },
        [{ tobacco_inventory_id: 'inv-1', tobacco_id: 'tob-1', brand: 'Tangiers', flavor: 'Birquq', grams_used: 20, percentage: 100 }],
      )
    })

    expect(session).not.toBeNull()
    expect((session as { id: string }).id).toMatch(/^demo-/)
    expect(mockSetItems).toHaveBeenCalledTimes(1)
    // Should NOT touch Supabase
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 4. createSession online — supabase insert + RPC call
  // -------------------------------------------------------------------------
  it('createSession online inserts session, items, and deducts inventory via RPC', async () => {
    const insertedSession = { id: 'new-session-id', profile_id: 'test-id', session_date: '2026-03-03', total_grams: 20 }

    // First from('sessions') call returns inserted session
    const sessionsQuery = chainableQuery({ data: insertedSession })
    // Second from('session_items') call returns success
    const itemsQuery = chainableQuery({ data: null, error: null })
    // Third from('inventory_transactions') call returns success
    const txQuery = chainableQuery({ data: null, error: null })

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'sessions') return sessionsQuery
      if (table === 'session_items') return itemsQuery
      if (table === 'inventory_transactions') return txQuery
      return chainableQuery({ data: null })
    })

    const { result } = renderHook(() => useSessions())

    let session: unknown
    await act(async () => {
      session = await result.current.createSession(
        { session_date: '2026-03-03', total_grams: 20, guest_id: null, bowl_type_id: null, compatibility_score: null, notes: null, rating: null, duration_minutes: null, selling_price: 25, created_by: null },
        [{ tobacco_inventory_id: 'inv-1', tobacco_id: 'tob-1', brand: 'Tangiers', flavor: 'Birquq', grams_used: 20, percentage: 100 }],
        true, // deductFromInventory
      )
    })

    expect(session).toEqual(insertedSession)

    // Verify supabase.from was called for sessions, session_items, and inventory_transactions
    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(mockFrom).toHaveBeenCalledWith('session_items')
    expect(mockFrom).toHaveBeenCalledWith('inventory_transactions')

    // Verify RPC was called for inventory deduction
    expect(mockRpc).toHaveBeenCalledWith('decrement_tobacco_inventory', {
      p_inventory_id: 'inv-1',
      p_grams_used: 20,
    })

    // Verify refresh was called
    expect(mockRefresh).toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 5. deleteSession returns false when no user
  // -------------------------------------------------------------------------
  it('deleteSession returns false when no user', async () => {
    setupDefaults({ user: null })

    const { result } = renderHook(() => useSessions())

    let deleted: boolean | undefined
    await act(async () => {
      deleted = await result.current.deleteSession('some-id')
    })

    expect(deleted).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 6. deleteSession in demo mode removes from local state
  // -------------------------------------------------------------------------
  it('deleteSession in demo mode removes session from local state', async () => {
    setupDefaults({ isDemoMode: true })

    const { result } = renderHook(() => useSessions())

    let deleted: boolean | undefined
    await act(async () => {
      deleted = await result.current.deleteSession('s1')
    })

    expect(deleted).toBe(true)
    expect(mockSetItems).toHaveBeenCalledTimes(1)

    // Verify the filter function removes the session with matching id
    const filterFn = mockSetItems.mock.calls[0][0]
    const filtered = filterFn([
      { id: 's1', session_items: [] },
      { id: 's2', session_items: [] },
    ])
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('s2')
  })

  // -------------------------------------------------------------------------
  // 7. updateSession online calls supabase update
  // -------------------------------------------------------------------------
  it('updateSession online calls supabase update and refreshes', async () => {
    const updateQuery = chainableQuery({ data: null, error: null })
    mockFrom.mockReturnValue(updateQuery)

    const { result } = renderHook(() => useSessions())

    let updated: boolean | undefined
    await act(async () => {
      updated = await result.current.updateSession('s1', { selling_price: 30 })
    })

    expect(updated).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('sessions')
    expect(updateQuery.update).toHaveBeenCalledWith({ selling_price: 30 })
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 's1')
    expect(mockRefresh).toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // 8. getSession fetches with session_items and bowl_type
  // -------------------------------------------------------------------------
  it('getSession fetches session with items and bowl_type via select', async () => {
    const fullSession = {
      id: 's1',
      profile_id: 'test-id',
      session_date: '2026-03-03',
      total_grams: 20,
      session_items: [{ id: 'si1', session_id: 's1', brand: 'Tangiers', flavor: 'Birquq', grams_used: 20 }],
      bowl_type: { id: 'bt1', name: 'Phunnel' },
    }
    const selectQuery = chainableQuery({ data: fullSession })
    mockFrom.mockReturnValue(selectQuery)

    const { result } = renderHook(() => useSessions())

    let fetched: unknown
    await act(async () => {
      fetched = await result.current.getSession('s1')
    })

    expect(fetched).toEqual(fullSession)
    expect(mockFrom).toHaveBeenCalledWith('sessions')
    // Verify select includes session_items and bowl_type
    expect(selectQuery.select).toHaveBeenCalledWith(
      expect.stringContaining('session_items'),
    )
    expect(selectQuery.eq).toHaveBeenCalledWith('id', 's1')
    expect(selectQuery.single).toHaveBeenCalled()
  })
})
