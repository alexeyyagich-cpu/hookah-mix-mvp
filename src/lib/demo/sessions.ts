import type { SessionWithItems, BowlType } from '@/types/database'

const D = 24 * 60 * 60 * 1000
const H = 60 * 60 * 1000

export const DEMO_BOWL: BowlType = { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() }
export const DEMO_BOWL_M: BowlType = { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() }

export const DEMO_SESSIONS: SessionWithItems[] = [
  // Today — 2 sessions
  {
    id: '1', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: '1',
    bowl_type_id: '1', session_date: new Date(Date.now() - 2 * H).toISOString(),
    total_grams: 20, compatibility_score: 92, notes: 'Great mix!', rating: 5, duration_minutes: 52, selling_price: 15,
    session_items: [
      { id: '1', session_id: '1', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
      { id: '2', session_id: '1', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '2', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 5 * H).toISOString(),
    total_grams: 18, compatibility_score: 85, notes: null, rating: 4, duration_minutes: 45, selling_price: 20,
    session_items: [
      { id: '3', session_id: '2', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 12, percentage: 67 },
      { id: '4', session_id: '2', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 6, percentage: 33 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // Yesterday — 3 sessions
  {
    id: '3', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: '2',
    bowl_type_id: '1', session_date: new Date(Date.now() - 1 * D).toISOString(),
    total_grams: 20, compatibility_score: 90, notes: null, rating: 5, duration_minutes: 48, selling_price: 15,
    session_items: [
      { id: '5', session_id: '3', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '6', session_id: '3', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '4', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 1 * D - 3 * H).toISOString(),
    total_grams: 18, compatibility_score: 82, notes: null, rating: 4, duration_minutes: 40, selling_price: 20,
    session_items: [
      { id: '7', session_id: '4', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 18, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '5', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: '4',
    bowl_type_id: '2', session_date: new Date(Date.now() - 1 * D - 6 * H).toISOString(),
    total_grams: 15, compatibility_score: 78, notes: null, rating: 3, duration_minutes: 35, selling_price: 12,
    session_items: [
      { id: '8', session_id: '5', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 15, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL_M,
  },
  // 2 days ago — 1 session
  {
    id: '6', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 2 * D).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4, duration_minutes: 50, selling_price: 20,
    session_items: [
      { id: '9', session_id: '6', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 10, percentage: 50 },
      { id: '10', session_id: '6', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 3 days ago — 2 sessions
  {
    id: '7', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: '1',
    bowl_type_id: '1', session_date: new Date(Date.now() - 3 * D).toISOString(),
    total_grams: 20, compatibility_score: 95, notes: 'Signature mix for Alex', rating: 5, duration_minutes: 55, selling_price: 25,
    session_items: [
      { id: '11', session_id: '7', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 12, percentage: 60 },
      { id: '12', session_id: '7', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 8, percentage: 40 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '8', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: '3',
    bowl_type_id: '1', session_date: new Date(Date.now() - 3 * D - 4 * H).toISOString(),
    total_grams: 18, compatibility_score: 80, notes: null, rating: 4, duration_minutes: 42, selling_price: 20,
    session_items: [
      { id: '13', session_id: '8', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 9, percentage: 50 },
      { id: '14', session_id: '8', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 9, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 5 days ago — 1 session
  {
    id: '9', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: '2',
    bowl_type_id: '1', session_date: new Date(Date.now() - 5 * D).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4, duration_minutes: 47, selling_price: 20,
    session_items: [
      { id: '15', session_id: '9', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '16', session_id: '9', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 6 days ago — 2 sessions
  {
    id: '10', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 6 * D).toISOString(),
    total_grams: 20, compatibility_score: 91, notes: null, rating: 5, duration_minutes: 53, selling_price: 15,
    session_items: [
      { id: '17', session_id: '10', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
      { id: '18', session_id: '10', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '11', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '2', session_date: new Date(Date.now() - 6 * D - 5 * H).toISOString(),
    total_grams: 15, compatibility_score: 75, notes: 'Try with less mint next time', rating: 3, duration_minutes: 30, selling_price: 12,
    session_items: [
      { id: '19', session_id: '11', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 15, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL_M,
  },
]
