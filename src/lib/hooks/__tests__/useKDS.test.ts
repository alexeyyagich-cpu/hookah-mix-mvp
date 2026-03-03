import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { makeKdsOrder, mockAuthReturn, mockOrgContext, TEST_PROFILE } from '@/__tests__/hookHelpers'
import { mockQueryBuilder } from '@/app/api/__tests__/helpers'
import type { KdsOrder } from '@/types/database'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockUseAuth, mockUseOrgContext, mockFrom, mockRpc, mockGetCached, mockSetCached } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseOrgContext: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockGetCached: vi.fn(),
  mockSetCached: vi.fn(),
}))

vi.mock('@/lib/AuthContext', () => ({ useAuth: mockUseAuth }))
vi.mock('@/lib/hooks/useOrganization', () => ({ useOrganizationContext: mockUseOrgContext }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))
vi.mock('@/lib/config', () => ({ isSupabaseConfigured: true }))
vi.mock('@/lib/offline/db', () => ({
  getCachedData: mockGetCached,
  setCachedData: mockSetCached,
}))
vi.mock('@/lib/offline/offlineMutation', () => ({
  enqueueOfflineMutation: vi.fn(),
  generateTempId: vi.fn(() => 'temp-kds-id'),
}))
vi.mock('@/lib/utils/translateError', () => ({
  translateError: vi.fn((e: Error | { message?: string }) => e?.message || 'error'),
}))

// ---------------------------------------------------------------------------
// Chainable query builder (extends standard helper with `not`)
// ---------------------------------------------------------------------------
function chainableQuery(result: { data?: unknown; error?: unknown }) {
  const qb = mockQueryBuilder(result)
  qb.not = vi.fn().mockReturnValue(qb)
  return qb
}

// ---------------------------------------------------------------------------
// Default mocks
// ---------------------------------------------------------------------------
beforeEach(() => {
  // shouldAdvanceTime lets waitFor's internal setTimeout work alongside fake timers
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.clearAllMocks()

  mockUseAuth.mockReturnValue(mockAuthReturn())
  mockUseOrgContext.mockReturnValue(mockOrgContext())
  mockGetCached.mockResolvedValue(null)
  mockSetCached.mockResolvedValue(undefined)

  // Default: from() returns empty result (no active orders)
  mockFrom.mockReturnValue(chainableQuery({ data: [] }))
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Import under test (after mocks are registered)
// ---------------------------------------------------------------------------
const importHook = () => import('../useKDS')

// ---------------------------------------------------------------------------
// Demo mode tests
// ---------------------------------------------------------------------------
describe('useKDS — demo mode', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuthReturn({ isDemoMode: true }))
  })

  it('loads DEMO_KDS_ORDERS when isDemoMode', async () => {
    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.orders.length).toBeGreaterThan(0)
    // Verify the demo orders have expected IDs
    expect(result.current.orders.some(o => o.id.startsWith('demo-kds-'))).toBe(true)
  })

  it('createOrder in demo mode adds to local state', async () => {
    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => expect(result.current.loading).toBe(false))

    const countBefore = result.current.orders.length

    let created: KdsOrder | null = null
    await act(async () => {
      created = await result.current.createOrder({
        table_id: 'table-99',
        table_name: 'Test Table',
        guest_name: 'New Guest',
        type: 'bar',
        items: [{ name: 'Espresso Martini', quantity: 1, details: null }],
        notes: null,
      })
    })

    expect(created).not.toBeNull()
    expect(created!.status).toBe('new')
    expect(created!.source).toBe('staff')
    expect(result.current.orders.length).toBe(countBefore + 1)
    // Supabase should NOT be called in demo mode (createOrder path)
    // Note: mockFrom may still be set up as a default, but createOrder should not invoke it
  })

  it('updateStatus transitions status and removes served/cancelled orders', async () => {
    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Pick the first 'new' order to transition to 'preparing'
    const newOrder = result.current.orders.find(o => o.status === 'new')
    expect(newOrder).toBeDefined()

    await act(async () => {
      await result.current.updateStatus(newOrder!.id, 'preparing')
    })

    const updated = result.current.orders.find(o => o.id === newOrder!.id)
    expect(updated).toBeDefined()
    expect(updated!.status).toBe('preparing')

    // Now mark as 'served' — should be removed from the list
    await act(async () => {
      await result.current.updateStatus(newOrder!.id, 'served')
    })

    const removed = result.current.orders.find(o => o.id === newOrder!.id)
    expect(removed).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Online mode tests
// ---------------------------------------------------------------------------
describe('useKDS — online mode', () => {
  it('returns empty orders initially', async () => {
    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('createOrder inserts via supabase', async () => {
    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => expect(result.current.loading).toBe(false))

    const insertedOrder = makeKdsOrder({ id: 'server-order-1', status: 'new' })
    // Mock the insert chain for createOrder
    mockFrom.mockReturnValue(chainableQuery({ data: insertedOrder }))

    let created: KdsOrder | null = null
    await act(async () => {
      created = await result.current.createOrder({
        table_id: 'table-1',
        table_name: 'Table 1',
        guest_name: 'Alice',
        type: 'hookah',
        items: [{ name: 'Tangiers Cane Mint', quantity: 1, details: null }],
        notes: null,
      })
    })

    expect(created).not.toBeNull()
    expect(created!.id).toBe('server-order-1')
    expect(mockFrom).toHaveBeenCalledWith('kds_orders')
    expect(result.current.orders).toContainEqual(insertedOrder)
  })

  it('updateStatus calls supabase update', async () => {
    // Start with one order in state by having fetchOrders return it
    const existingOrder = makeKdsOrder({ id: 'order-to-update', status: 'new' })
    mockFrom.mockReturnValue(chainableQuery({ data: [existingOrder] }))

    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.orders.length).toBe(1)
    })

    // Mock the update chain
    mockFrom.mockReturnValue(chainableQuery({ data: null, error: null }))

    let success = false
    await act(async () => {
      success = await result.current.updateStatus('order-to-update', 'preparing')
    })

    expect(success).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('kds_orders')
    // Order should still be in the list with 'preparing' status
    const updated = result.current.orders.find(o => o.id === 'order-to-update')
    expect(updated).toBeDefined()
    expect(updated!.status).toBe('preparing')
  })

  it('cancelOrder delegates to updateStatus with cancelled', async () => {
    const existingOrder = makeKdsOrder({ id: 'order-to-cancel', status: 'new' })
    mockFrom.mockReturnValue(chainableQuery({ data: [existingOrder] }))

    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.orders.length).toBe(1)
    })

    // Mock the update chain for cancel
    mockFrom.mockReturnValue(chainableQuery({ data: null, error: null }))

    let success = false
    await act(async () => {
      success = await result.current.cancelOrder('order-to-cancel')
    })

    expect(success).toBe(true)
    // 'cancelled' is a completed status, so the order should be removed
    const cancelled = result.current.orders.find(o => o.id === 'order-to-cancel')
    expect(cancelled).toBeUndefined()
  })

  it('served orders are removed from state', async () => {
    const existingOrder = makeKdsOrder({ id: 'order-served', status: 'ready' })
    mockFrom.mockReturnValue(chainableQuery({ data: [existingOrder] }))

    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.orders.length).toBe(1)
    })

    // Mock update chain
    mockFrom.mockReturnValue(chainableQuery({ data: null, error: null }))

    await act(async () => {
      await result.current.updateStatus('order-served', 'served')
    })

    expect(result.current.orders.find(o => o.id === 'order-served')).toBeUndefined()
    expect(result.current.orders.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Edge case tests
// ---------------------------------------------------------------------------
describe('useKDS — edge cases', () => {
  it('returns empty orders when no user', async () => {
    mockUseAuth.mockReturnValue(mockAuthReturn({ user: null, profile: null }))

    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual([])
  })

  it('createOrder returns null when no user', async () => {
    mockUseAuth.mockReturnValue(mockAuthReturn({ user: null, profile: null }))

    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => expect(result.current.loading).toBe(false))

    let created: KdsOrder | null = null
    await act(async () => {
      created = await result.current.createOrder({
        table_id: null,
        table_name: null,
        guest_name: null,
        type: 'bar',
        items: [{ name: 'Test', quantity: 1, details: null }],
        notes: null,
      })
    })

    expect(created).toBeNull()
  })

  it('fetchOrders uses IDB cache when offline', async () => {
    const cachedOrders: KdsOrder[] = [
      makeKdsOrder({ id: 'cached-1', status: 'new' }),
      makeKdsOrder({ id: 'cached-2', status: 'preparing' }),
    ]

    mockGetCached.mockResolvedValue({ data: cachedOrders })

    // Simulate offline: fetchOrders will use cache and stop before network call
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

    const { useKDS } = await importHook()
    const { result } = renderHook(() => useKDS())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGetCached).toHaveBeenCalledWith('kds_orders', TEST_PROFILE.id)
    // Should have the cached orders since we're offline
    expect(result.current.orders).toEqual(cachedOrders)

    // Restore online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  })
})
