'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import type { LoungeProfile, PublicMix, PublicBarRecipe, WorkingHours, LoungeFeature } from '@/types/lounge'

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

// Demo cocktails for public menu — Leipzig hookah lounge
const DEMO_BAR_RECIPES: PublicBarRecipe[] = [
  {
    id: 'pub-r1', name: 'Мохито', name_en: 'Mojito',
    description: 'Освежающий кубинский коктейль с мятой и лаймом',
    method: 'muddle', glass: 'highball', garnish_description: 'Мята, лайм', menu_price: 9,
    ingredients: ['Белый ром', 'Сок лайма', 'Сахарный сироп', 'Содовая', 'Мята'],
  },
  {
    id: 'pub-r2', name: 'Негрони', name_en: 'Negroni',
    description: 'Итальянская классика с горьковатым послевкусием',
    method: 'stir', glass: 'rocks', garnish_description: 'Долька апельсина', menu_price: 11,
    ingredients: ['Джин', 'Кампари', 'Сладкий вермут'],
  },
  {
    id: 'pub-r3', name: 'Апероль Шприц', name_en: 'Aperol Spritz',
    description: 'Итальянский аперитив — горький, свежий, идеальный на террасе',
    method: 'build', glass: 'wine', garnish_description: 'Долька апельсина', menu_price: 9,
    ingredients: ['Апероль', 'Просекко', 'Содовая'],
  },
  {
    id: 'pub-r4', name: 'Эспрессо Мартини', name_en: 'Espresso Martini',
    description: 'Кофейный коктейль с водкой — энергия и вкус',
    method: 'shake', glass: 'coupe', garnish_description: 'Три зерна кофе', menu_price: 11,
    ingredients: ['Водка', 'Кофейный ликёр', 'Эспрессо'],
  },
  {
    id: 'pub-r5', name: 'Leipzig Sour', name_en: 'Leipzig Sour',
    description: 'Авторский сауэр с облепихой и мёдом — наш бестселлер',
    method: 'shake', glass: 'coupe', garnish_description: 'Облепиха, тимьян', menu_price: 12,
    ingredients: ['Джин', 'Облепиховый сироп', 'Медовый сироп', 'Сок лимона'],
  },
  {
    id: 'pub-r6', name: 'Московский мул', name_en: 'Moscow Mule',
    description: 'Водка с имбирным пивом и лаймом в медной кружке',
    method: 'build', glass: 'copper_mug', garnish_description: 'Лайм, имбирь', menu_price: 9,
    ingredients: ['Водка', 'Имбирное пиво', 'Сок лайма'],
  },
  {
    id: 'pub-r7', name: 'Джин-Тоник', name_en: 'Gin & Tonic',
    description: 'Лёгкий лонг-дринк с ботаникой',
    method: 'build', glass: 'highball', garnish_description: 'Долька лайма, розмарин', menu_price: 8,
    ingredients: ['Джин', 'Тоник'],
  },
  {
    id: 'pub-r8', name: 'Tropical Hookah', name_en: 'Tropical Hookah',
    description: 'Безалкогольный тропический коктейль — идеально к кальяну',
    method: 'shake', glass: 'highball', garnish_description: 'Ананас, зонтик', menu_price: 7,
    ingredients: ['Ананасовый сок', 'Маракуйя пюре', 'Кокосовый сироп', 'Сок лайма'],
  },
]

// Public table info for QR ordering
export interface PublicTable {
  id: string
  name: string
}

// Demo tables for demo-lounge
const DEMO_TABLES: PublicTable[] = [
  { id: '1', name: 'Стол 1' },
  { id: '2', name: 'Стол 2' },
  { id: '3', name: 'VIP' },
  { id: '4', name: 'Стол 4' },
  { id: '5', name: 'Барная стойка' },
]

// Hook for public lounge viewing (by slug)
interface UsePublicLoungeReturn {
  lounge: LoungeProfile | null
  mixes: PublicMix[]
  barRecipes: PublicBarRecipe[]
  tables: PublicTable[]
  loading: boolean
  error: string | null
}

export function usePublicLounge(slug: string): UsePublicLoungeReturn {
  const [lounge, setLounge] = useState<LoungeProfile | null>(null)
  const [mixes, setMixes] = useState<PublicMix[]>([])
  const [barRecipes, setBarRecipes] = useState<PublicBarRecipe[]>([])
  const [tables, setTables] = useState<PublicTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // For demo, return demo lounge if slug matches
    if (slug === 'demo-lounge') {
      setLounge(DEMO_LOUNGE)
      setMixes(DEMO_MIXES)
      setBarRecipes(DEMO_BAR_RECIPES)
      setTables(DEMO_TABLES)
      setLoading(false)
    } else {
      // Fetch from public menu API
      fetch(`/api/public/menu/${slug}`)
        .then(res => {
          if (!res.ok) throw new Error('Заведение не найдено')
          return res.json()
        })
        .then(data => {
          // Build a minimal lounge profile from API response
          setLounge({
            ...DEMO_LOUNGE,
            slug,
            name: data.venue.name || slug,
            logo_url: data.venue.logo_url,
            is_public: true,
            show_menu: true,
            show_prices: true,
            show_popular_mixes: true,
          })
          setBarRecipes(data.barRecipes || [])
          setTables(data.tables || [])
          setLoading(false)
        })
        .catch(() => {
          setError('Заведение не найдено')
          setLoading(false)
        })
    }
  }, [slug])

  return { lounge, mixes, barRecipes, tables, loading, error }
}
