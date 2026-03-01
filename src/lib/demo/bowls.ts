import type { BowlType } from '@/types/database'

export const DEMO_BOWLS: BowlType[] = [
  { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', name: 'Turka Classic', capacity_grams: 18, is_default: false, created_at: new Date().toISOString() },
]
