import type { TobaccoInventory, InventoryTransaction } from '@/types/database'

const _D = 24 * 60 * 60 * 1000

export const DEMO_INVENTORY: TobaccoInventory[] = [
  { id: '1', profile_id: 'demo', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity_grams: 180, purchase_price: 15, package_grams: 100, purchase_date: new Date(Date.now() - 10 * _D).toISOString(), expiry_date: new Date(Date.now() + 180 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 10 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', quantity_grams: 95, purchase_price: 15, package_grams: 100, purchase_date: new Date(Date.now() - 14 * _D).toISOString(), expiry_date: new Date(Date.now() + 170 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 14 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', quantity_grams: 220, purchase_price: 18, package_grams: 100, purchase_date: new Date(Date.now() - 7 * _D).toISOString(), expiry_date: new Date(Date.now() + 200 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 7 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '4', profile_id: 'demo', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', quantity_grams: 45, purchase_price: 18, package_grams: 100, purchase_date: new Date(Date.now() - 21 * _D).toISOString(), expiry_date: new Date(Date.now() + 160 * _D).toISOString(), notes: 'Running low!', created_at: new Date(Date.now() - 21 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '5', profile_id: 'demo', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', quantity_grams: 150, purchase_price: 22, package_grams: 100, purchase_date: new Date(Date.now() - 5 * _D).toISOString(), expiry_date: new Date(Date.now() + 190 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 5 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '6', profile_id: 'demo', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', quantity_grams: 0, purchase_price: 14, package_grams: 100, purchase_date: new Date(Date.now() - 28 * _D).toISOString(), expiry_date: new Date(Date.now() + 150 * _D).toISOString(), notes: 'Need to order', created_at: new Date(Date.now() - 28 * _D).toISOString(), updated_at: new Date().toISOString() },
]

export const DEMO_TRANSACTIONS: InventoryTransaction[] = [
  // Today
  { id: '1', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -10, session_id: '1', notes: 'Pinkman', idempotency_key: null, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -10, session_id: '1', notes: 'Supernova', idempotency_key: null, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '3', profile_id: 'demo', tobacco_inventory_id: '5', type: 'session', quantity_grams: -12, session_id: '2', notes: 'Cane Mint', idempotency_key: null, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  // Yesterday
  { id: '4', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -14, session_id: '3', notes: 'Pinkman', idempotency_key: null, created_at: new Date(Date.now() - 1 * _D).toISOString() },
  { id: '5', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -18, session_id: '4', notes: 'Supernova', idempotency_key: null, created_at: new Date(Date.now() - 1 * _D).toISOString() },
  { id: '6', profile_id: 'demo', tobacco_inventory_id: '4', type: 'session', quantity_grams: -15, session_id: '5', notes: 'Bananapapa', idempotency_key: null, created_at: new Date(Date.now() - 1 * _D).toISOString() },
  // 2 days ago
  { id: '7', profile_id: 'demo', tobacco_inventory_id: '2', type: 'session', quantity_grams: -10, session_id: '6', notes: 'Lemon-Lime', idempotency_key: null, created_at: new Date(Date.now() - 2 * _D).toISOString() },
  // 3 days ago
  { id: '8', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -12, session_id: '7', notes: 'Pinkman', idempotency_key: null, created_at: new Date(Date.now() - 3 * _D).toISOString() },
  { id: '9', profile_id: 'demo', tobacco_inventory_id: '4', type: 'session', quantity_grams: -9, session_id: '8', notes: 'Bananapapa', idempotency_key: null, created_at: new Date(Date.now() - 3 * _D).toISOString() },
  // 5 days ago
  { id: '10', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -14, session_id: '9', notes: 'Pinkman', idempotency_key: null, created_at: new Date(Date.now() - 5 * _D).toISOString() },
  // 6 days ago
  { id: '11', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -10, session_id: '10', notes: 'Supernova', idempotency_key: null, created_at: new Date(Date.now() - 6 * _D).toISOString() },
  // Initial purchases
  { id: '12', profile_id: 'demo', tobacco_inventory_id: '1', type: 'purchase', quantity_grams: 200, session_id: null, notes: 'Purchase', idempotency_key: null, created_at: new Date(Date.now() - 10 * _D).toISOString() },
  { id: '13', profile_id: 'demo', tobacco_inventory_id: '3', type: 'purchase', quantity_grams: 200, session_id: null, notes: 'Purchase', idempotency_key: null, created_at: new Date(Date.now() - 10 * _D).toISOString() },
]
