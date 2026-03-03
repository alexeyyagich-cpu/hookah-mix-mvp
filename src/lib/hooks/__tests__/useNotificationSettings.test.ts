import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Hoisted mocks -- created before vi.mock() factories execute
// ---------------------------------------------------------------------------
const { mockUseAuth, mockFrom } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/AuthContext', () => ({ useAuth: mockUseAuth }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))
vi.mock('@/lib/config', () => ({ isSupabaseConfigured: true }))

// ---------------------------------------------------------------------------
// Chainable query-builder helper
// ---------------------------------------------------------------------------
// Creates an object whose methods (select, eq, update, upsert, single, etc.)
// all return the same builder, except `single` which resolves the promise.
// Awaiting the builder directly (without calling .single()) also resolves it.
// This mirrors the Supabase JS client's API surface.
function mockQueryBuilder(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result)

  const builder: Record<string, unknown> = {}

  const chainMethod = () => builder

  // Standard chain methods -- each returns the builder itself
  builder.select = vi.fn(chainMethod)
  builder.eq = vi.fn(chainMethod)
  builder.update = vi.fn(chainMethod)
  builder.upsert = vi.fn(chainMethod)
  builder.insert = vi.fn(chainMethod)
  builder.delete = vi.fn(chainMethod)

  // Terminal -- .single() resolves the promise
  builder.single = vi.fn(() => promise)

  // Make the builder itself thenable so `await supabase.from(...).update(...).eq(...)`
  // works even without an explicit .single() call (used by updateSettings).
  builder.then = (
    onFulfilled?: (v: unknown) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => promise.then(onFulfilled, onRejected)

  return builder
}

// Import hook AFTER mocks are wired
import { useNotificationSettings } from '../useNotificationSettings'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const DEMO_USER = { id: 'demo' }
const ONLINE_USER = { id: 'test-id' }

const EXISTING_SETTINGS = {
  id: 'settings-1',
  profile_id: 'test-id',
  low_stock_enabled: false,
  low_stock_threshold: 100,
  created_at: '2026-01-01T00:00:00Z',
}

const DEFAULT_UPSERTED = {
  id: 'settings-new',
  profile_id: 'test-id',
  low_stock_enabled: true,
  low_stock_threshold: 50,
  created_at: '2026-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useNotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // Demo mode
  // =========================================================================
  describe('demo mode', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: DEMO_USER, isDemoMode: true })
    })

    it('returns DEMO_SETTINGS when isDemoMode is true and user exists', async () => {
      const { result } = renderHook(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.settings).toMatchObject({
        id: 'demo',
        profile_id: 'demo',
        low_stock_enabled: true,
        low_stock_threshold: 50,
      })
      expect(result.current.error).toBeNull()
      // Supabase should never be called in demo mode
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('updateSettings in demo mode changes local state without calling supabase', async () => {
      const { result } = renderHook(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateSettings({ low_stock_threshold: 75 })
      })

      expect(result.current.settings?.low_stock_threshold).toBe(75)
      // low_stock_enabled should remain unchanged
      expect(result.current.settings?.low_stock_enabled).toBe(true)
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // fetchSettings
  // =========================================================================
  describe('fetchSettings', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: ONLINE_USER, isDemoMode: false })
    })

    it('sets settings from a successful fetch', async () => {
      mockFrom.mockReturnValue(
        mockQueryBuilder({ data: EXISTING_SETTINGS, error: null }),
      )

      const { result } = renderHook(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.settings).toEqual(EXISTING_SETTINGS)
      expect(result.current.error).toBeNull()
    })

    it('creates default settings when PGRST116 error (row not found)', async () => {
      // First call: .from().select().eq().single() -> PGRST116
      // Second call: .from().upsert().select().single() -> success
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return mockQueryBuilder({
            data: null,
            error: { code: 'PGRST116', message: 'Row not found' },
          })
        }
        return mockQueryBuilder({
          data: DEFAULT_UPSERTED,
          error: null,
        })
      })

      const { result } = renderHook(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.settings).toEqual(DEFAULT_UPSERTED)
      expect(result.current.error).toBeNull()
      // from() should have been called twice (select then upsert)
      expect(mockFrom).toHaveBeenCalledTimes(2)
    })

    it('sets error on other fetch errors', async () => {
      mockFrom.mockReturnValue(
        mockQueryBuilder({
          data: null,
          error: { code: '42501', message: 'permission denied' },
        }),
      )

      const { result } = renderHook(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.settings).toBeNull()
      expect(result.current.error).toBe('Failed to load settings')
    })
  })

  // =========================================================================
  // updateSettings (online mode)
  // =========================================================================
  describe('updateSettings', () => {
    it('does nothing when no user, supabase, or settings', async () => {
      // No user -> fetchSettings and updateSettings both bail early
      mockUseAuth.mockReturnValue({ user: null, isDemoMode: false })

      const { result } = renderHook(() => useNotificationSettings())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const callsBeforeUpdate = mockFrom.mock.calls.length

      await act(async () => {
        await result.current.updateSettings({ low_stock_enabled: false })
      })

      // updateSettings should NOT have triggered any additional supabase calls
      expect(mockFrom.mock.calls.length).toBe(callsBeforeUpdate)
    })

    it('calls supabase update and updates local state on success', async () => {
      mockUseAuth.mockReturnValue({ user: ONLINE_USER, isDemoMode: false })

      // fetchSettings will call from() once during useEffect; then
      // updateSettings will call from() again.
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // fetchSettings -> returns EXISTING_SETTINGS
          return mockQueryBuilder({ data: EXISTING_SETTINGS, error: null })
        }
        // updateSettings -> success (no data needed)
        return mockQueryBuilder({ data: null, error: null })
      })

      const { result } = renderHook(() => useNotificationSettings())

      // Wait for initial fetch to populate settings
      await waitFor(() => {
        expect(result.current.settings).toEqual(EXISTING_SETTINGS)
      })

      await act(async () => {
        await result.current.updateSettings({ low_stock_enabled: true })
      })

      expect(result.current.settings?.low_stock_enabled).toBe(true)
      // The rest of the fields should remain untouched
      expect(result.current.settings?.low_stock_threshold).toBe(100)
      expect(result.current.error).toBeNull()
    })

    it('sets error and rethrows on supabase error', async () => {
      mockUseAuth.mockReturnValue({ user: ONLINE_USER, isDemoMode: false })

      let callCount = 0
      const updateError = new Error('network failure')

      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // fetchSettings -> returns EXISTING_SETTINGS
          return mockQueryBuilder({ data: EXISTING_SETTINGS, error: null })
        }
        // updateSettings -> failure
        return mockQueryBuilder({ data: null, error: updateError })
      })

      const { result } = renderHook(() => useNotificationSettings())

      // Wait for initial fetch to populate settings
      await waitFor(() => {
        expect(result.current.settings).toEqual(EXISTING_SETTINGS)
      })

      // Catch the rethrown error manually so act() can flush state updates
      let thrownError: unknown = null
      await act(async () => {
        try {
          await result.current.updateSettings({ low_stock_threshold: 25 })
        } catch (err) {
          thrownError = err
        }
      })

      expect(thrownError).toBeInstanceOf(Error)
      expect((thrownError as Error).message).toBe('network failure')
      expect(result.current.error).toBe('network failure')
      // Settings should NOT have been mutated
      expect(result.current.settings?.low_stock_threshold).toBe(100)
    })
  })
})
