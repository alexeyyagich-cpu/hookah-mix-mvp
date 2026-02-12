'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import type { LoungeProfile, PublicMix, WorkingHours, LoungeFeature } from '@/types/lounge'

// Demo lounge profile
const DEMO_LOUNGE: LoungeProfile = {
  id: 'demo-lounge-1',
  profile_id: 'demo',
  slug: 'demo-lounge',
  name: 'Demo Lounge',
  description: 'Уютная кальянная в центре города с авторскими миксами и живой музыкой по выходным. Мы создаём атмосферу, где каждый гость чувствует себя особенным.',
  logo_url: null,
  cover_image_url: '/images/dashboard-bg.jpg',
  city: 'Warsaw',
  address: 'ul. Nowy Swiat 42',
  latitude: 52.2297,
  longitude: 21.0122,
  phone: '+48 22 123 4567',
  email: 'hello@demo-lounge.com',
  website: 'https://demo-lounge.com',
  instagram: 'demo_lounge',
  telegram: 'demo_lounge_chat',
  working_hours: {
    monday: { open: '18:00', close: '02:00' },
    tuesday: { open: '18:00', close: '02:00' },
    wednesday: { open: '18:00', close: '02:00' },
    thursday: { open: '18:00', close: '03:00' },
    friday: { open: '18:00', close: '05:00' },
    saturday: { open: '16:00', close: '05:00' },
    sunday: { open: '16:00', close: '00:00' },
  },
  features: ['wifi', 'terrace', 'vip_rooms', 'food', 'alcohol', 'live_music', 'reservations'],
  is_public: true,
  show_menu: true,
  show_prices: true,
  show_popular_mixes: true,
  rating: 4.8,
  reviews_count: 124,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_MIXES: PublicMix[] = [
  {
    id: 'mix-1',
    lounge_id: 'demo-lounge-1',
    name: 'Signature Pink',
    description: 'Наш фирменный микс с ягодными нотами и освежающей мятой',
    tobaccos: [
      { brand: 'Musthave', flavor: 'Pinkman', percent: 50, color: '#EC4899' },
      { brand: 'Darkside', flavor: 'Supernova', percent: 30, color: '#06B6D4' },
      { brand: 'Tangiers', flavor: 'Cane Mint', percent: 20, color: '#10B981' },
    ],
    price: 450,
    is_signature: true,
    popularity: 156,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mix-2',
    lounge_id: 'demo-lounge-1',
    name: 'Tropical Storm',
    description: 'Взрыв тропических фруктов с лёгкой прохладой',
    tobaccos: [
      { brand: 'Darkside', flavor: 'Falling Star', percent: 40, color: '#F59E0B' },
      { brand: 'Tangiers', flavor: 'Pineapple', percent: 35, color: '#FCD34D' },
      { brand: 'Darkside', flavor: 'Supernova', percent: 25, color: '#06B6D4' },
    ],
    price: 400,
    is_signature: true,
    popularity: 98,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mix-3',
    lounge_id: 'demo-lounge-1',
    name: 'Berry Bliss',
    description: 'Классическое сочетание лесных ягод',
    tobaccos: [
      { brand: 'Darkside', flavor: 'Wild Forest', percent: 60, color: '#EF4444' },
      { brand: 'Musthave', flavor: 'Blueberry', percent: 40, color: '#6366F1' },
    ],
    price: 380,
    is_signature: false,
    popularity: 67,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mix-4',
    lounge_id: 'demo-lounge-1',
    name: 'Citrus Fresh',
    description: 'Освежающий цитрусовый микс для жаркого дня',
    tobaccos: [
      { brand: 'Musthave', flavor: 'Lemon-Lime', percent: 45, color: '#A3E635' },
      { brand: 'Musthave', flavor: 'Grapefruit', percent: 35, color: '#FB7185' },
      { brand: 'Tangiers', flavor: 'Cane Mint', percent: 20, color: '#10B981' },
    ],
    price: 420,
    is_signature: false,
    popularity: 45,
    created_at: new Date().toISOString(),
  },
]

interface UseLoungeProfileReturn {
  lounge: LoungeProfile | null
  mixes: PublicMix[]
  loading: boolean
  error: string | null
  updateLounge: (updates: Partial<LoungeProfile>) => Promise<void>
  addMix: (mix: Omit<PublicMix, 'id' | 'lounge_id' | 'created_at' | 'popularity'>) => Promise<void>
  updateMix: (id: string, updates: Partial<PublicMix>) => Promise<void>
  deleteMix: (id: string) => Promise<void>
}

export function useLoungeProfile(): UseLoungeProfileReturn {
  const { user, isDemoMode } = useAuth()
  const [lounge, setLounge] = useState<LoungeProfile | null>(null)
  const [mixes, setMixes] = useState<PublicMix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode) {
      setLounge(DEMO_LOUNGE)
      setMixes(DEMO_MIXES)
      setLoading(false)
    } else if (user) {
      // TODO: Fetch from Supabase
      setLounge(null)
      setMixes([])
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [user, isDemoMode])

  const updateLounge = useCallback(async (updates: Partial<LoungeProfile>) => {
    if (!lounge) return
    setLounge({ ...lounge, ...updates, updated_at: new Date().toISOString() })
  }, [lounge])

  const addMix = useCallback(async (mix: Omit<PublicMix, 'id' | 'lounge_id' | 'created_at' | 'popularity'>) => {
    if (!lounge) return
    const newMix: PublicMix = {
      ...mix,
      id: `mix-${Date.now()}`,
      lounge_id: lounge.id,
      popularity: 0,
      created_at: new Date().toISOString(),
    }
    setMixes(prev => [...prev, newMix])
  }, [lounge])

  const updateMix = useCallback(async (id: string, updates: Partial<PublicMix>) => {
    setMixes(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  }, [])

  const deleteMix = useCallback(async (id: string) => {
    setMixes(prev => prev.filter(m => m.id !== id))
  }, [])

  return {
    lounge,
    mixes,
    loading,
    error,
    updateLounge,
    addMix,
    updateMix,
    deleteMix,
  }
}

// Hook for public lounge viewing (by slug)
interface UsePublicLoungeReturn {
  lounge: LoungeProfile | null
  mixes: PublicMix[]
  loading: boolean
  error: string | null
}

export function usePublicLounge(slug: string): UsePublicLoungeReturn {
  const [lounge, setLounge] = useState<LoungeProfile | null>(null)
  const [mixes, setMixes] = useState<PublicMix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // For demo, return demo lounge if slug matches
    if (slug === 'demo-lounge') {
      setLounge(DEMO_LOUNGE)
      setMixes(DEMO_MIXES)
      setLoading(false)
    } else {
      // TODO: Fetch from Supabase by slug
      setError('Заведение не найдено')
      setLoading(false)
    }
  }, [slug])

  return { lounge, mixes, loading, error }
}
