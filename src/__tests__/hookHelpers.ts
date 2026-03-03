import { vi } from 'vitest'
import type {
  SessionWithItems, SessionItem, BarSale, TobaccoInventory,
  KdsOrder, BarInventoryItem, NotificationSettings,
} from '@/types/database'

// Re-export existing helpers
export { TEST_USER, mockQueryBuilder, mockSupabaseClient } from '@/app/api/__tests__/helpers'

export const TEST_PROFILE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  business_name: 'Test Lounge',
  owner_name: 'Test Owner',
  phone: null,
  address: null,
  logo_url: null,
  subscription_tier: 'core' as const,
  subscription_expires_at: null,
  role: 'owner',
  owner_profile_id: null,
  venue_slug: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  trial_expires_at: null,
  onboarding_completed: true,
  business_type: 'hookah_bar' as const,
  active_modules: ['hookah', 'bar'],
  locale: 'en',
}

export function mockAuthReturn(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: TEST_PROFILE.id, email: 'test@example.com' },
    profile: TEST_PROFILE,
    isDemoMode: false,
    session: null,
    loading: false,
    signOut: vi.fn(),
    ...overrides,
  }
}

export function mockOrgContext(overrides: Record<string, unknown> = {}) {
  return {
    organizationId: null,
    locationId: null,
    organization: null,
    location: null,
    orgMembers: [],
    loading: false,
    ...overrides,
  }
}

export function mockSupabaseListReturn<T>(items: T[], overrides: Record<string, unknown> = {}) {
  return {
    items,
    setItems: vi.fn(),
    loading: false,
    error: null,
    setError: vi.fn(),
    refresh: vi.fn(),
    supabase: { from: vi.fn() },
    user: { id: TEST_PROFILE.id, email: 'test@example.com' },
    profile: TEST_PROFILE,
    organizationId: null,
    locationId: null,
    isDemoMode: false,
    ...overrides,
  }
}

// Test data factories

let counter = 0
function uid() { return `test-${++counter}` }

export function makeSessionItem(overrides: Partial<SessionItem> = {}): SessionItem {
  return {
    id: uid(),
    session_id: 'sess-1',
    tobacco_inventory_id: 'inv-1',
    tobacco_id: 'tob-1',
    brand: 'Tangiers',
    flavor: 'Cane Mint',
    grams_used: 15,
    percentage: 50,
    ...overrides,
  }
}

export function makeSession(overrides: Partial<SessionWithItems> = {}): SessionWithItems {
  return {
    id: uid(),
    profile_id: TEST_PROFILE.id,
    guest_id: null,
    bowl_type_id: null,
    session_date: new Date().toISOString(),
    total_grams: 30,
    compatibility_score: 85,
    notes: null,
    rating: null,
    duration_minutes: null,
    selling_price: 25,
    created_by: null,
    session_items: [makeSessionItem()],
    bowl_type: null,
    ...overrides,
  }
}

export function makeSale(overrides: Partial<BarSale> = {}): BarSale {
  return {
    id: uid(),
    profile_id: TEST_PROFILE.id,
    recipe_id: 'recipe-1',
    recipe_name: 'Mojito',
    quantity: 1,
    unit_price: 12,
    total_revenue: 12,
    total_cost: 4,
    margin_percent: 66.7,
    table_id: null,
    guest_name: null,
    notes: null,
    sold_at: new Date().toISOString(),
    ...overrides,
  }
}

export function makeInventoryItem(overrides: Partial<TobaccoInventory> = {}): TobaccoInventory {
  return {
    id: uid(),
    profile_id: TEST_PROFILE.id,
    tobacco_id: 'tob-1',
    brand: 'Tangiers',
    flavor: 'Cane Mint',
    quantity_grams: 200,
    purchase_price: 25,
    package_grams: 250,
    purchase_date: null,
    expiry_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function makeBarInventoryItem(overrides: Partial<BarInventoryItem> = {}): BarInventoryItem {
  return {
    id: uid(),
    profile_id: TEST_PROFILE.id,
    name: 'Rum',
    brand: 'Bacardi',
    category: 'spirits' as BarInventoryItem['category'],
    unit_type: 'ml' as BarInventoryItem['unit_type'],
    quantity: 700,
    min_quantity: 100,
    purchase_price: 20,
    package_size: 700,
    supplier_name: null,
    barcode: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function makeKdsOrder(overrides: Partial<KdsOrder> = {}): KdsOrder {
  return {
    id: uid(),
    profile_id: TEST_PROFILE.id,
    created_by: TEST_PROFILE.id,
    table_id: 'table-1',
    table_name: 'Table 1',
    guest_name: 'John',
    type: 'hookah',
    items: [{ name: 'Tangiers Cane Mint', quantity: 1, details: null }],
    status: 'new',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    source: 'staff',
    ...overrides,
  }
}

export function makeNotificationSettings(overrides: Partial<NotificationSettings> = {}): NotificationSettings {
  return {
    id: uid(),
    profile_id: TEST_PROFILE.id,
    low_stock_enabled: true,
    low_stock_threshold: 50,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
