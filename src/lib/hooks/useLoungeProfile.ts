'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import type { LoungeProfile, PublicMix, PublicBarRecipe } from '@/types/lounge'

// Demo lounge profile
const DEMO_LOUNGE: LoungeProfile = {
  id: 'demo-lounge-1',
  profile_id: 'demo',
  slug: 'demo-lounge',
  name: 'Demo Lounge',
  description: 'Cozy hookah lounge in the city center with signature mixes and live music on weekends. We create an atmosphere where every guest feels special.',
  logo_url: null,
  cover_image_url: '/images/dashboard-bg.jpg',
  city: 'Warsaw',
  address: 'ul. Nowy Swiat 42',
  latitude: null,
  longitude: null,
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
  is_published: true,
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
    description: 'Our signature mix with berry notes and refreshing mint',
    tobaccos: [
      { brand: 'Musthave', flavor: 'Pinkman', percent: 50, color: '#EC4899' },
      { brand: 'Darkside', flavor: 'Supernova', percent: 30, color: '#06B6D4' },
      { brand: 'Tangiers', flavor: 'Cane Mint', percent: 20, color: '#10B981' },
    ],
    price: 22,
    is_signature: true,
    popularity: 156,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mix-2',
    lounge_id: 'demo-lounge-1',
    name: 'Tropical Storm',
    description: 'Tropical fruit explosion with a light cool breeze',
    tobaccos: [
      { brand: 'Darkside', flavor: 'Falling Star', percent: 40, color: '#F59E0B' },
      { brand: 'Tangiers', flavor: 'Pineapple', percent: 35, color: '#FCD34D' },
      { brand: 'Darkside', flavor: 'Supernova', percent: 25, color: '#06B6D4' },
    ],
    price: 20,
    is_signature: true,
    popularity: 98,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mix-3',
    lounge_id: 'demo-lounge-1',
    name: 'Berry Bliss',
    description: 'Classic wild berry combination',
    tobaccos: [
      { brand: 'Darkside', flavor: 'Wild Forest', percent: 60, color: '#EF4444' },
      { brand: 'Musthave', flavor: 'Blueberry', percent: 40, color: '#6366F1' },
    ],
    price: 18,
    is_signature: false,
    popularity: 67,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mix-4',
    lounge_id: 'demo-lounge-1',
    name: 'Citrus Fresh',
    description: 'Refreshing citrus mix for a hot day',
    tobaccos: [
      { brand: 'Musthave', flavor: 'Lemon-Lime', percent: 45, color: '#A3E635' },
      { brand: 'Musthave', flavor: 'Grapefruit', percent: 35, color: '#FB7185' },
      { brand: 'Tangiers', flavor: 'Cane Mint', percent: 20, color: '#10B981' },
    ],
    price: 20,
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
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])
  const [lounge, setLounge] = useState<LoungeProfile | null>(null)
  const [mixes, setMixes] = useState<PublicMix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch lounge profile from Supabase
  useEffect(() => {
    if (isDemoMode) {
      setLounge(DEMO_LOUNGE)
      setMixes(DEMO_MIXES)
      setLoading(false)
      return
    }

    if (!user || !supabase) {
      setLounge(null)
      setMixes([])
      setLoading(false)
      return
    }

    const fetchLounge = async () => {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('lounge_profiles')
          .select('*')
          .eq('profile_id', user.id)
          .limit(1)
          .maybeSingle()

        if (fetchErr) {
          setError(fetchErr.message)
          setLoading(false)
          return
        }

        if (data) {
          // Map DB row to LoungeProfile type
          setLounge({
            ...data,
            latitude: null,
            longitude: null,
            features: data.features || [],
            working_hours: data.working_hours || null,
            is_published: data.is_published ?? false,
            show_menu: data.show_menu ?? true,
            show_prices: data.show_prices ?? true,
            show_popular_mixes: data.show_popular_mixes ?? true,
          })
        } else {
          setLounge(null)
        }

        // Fetch favorite mixes as public mixes
        const { data: savedMixes } = await supabase
          .from('saved_mixes')
          .select('*')
          .eq('profile_id', user.id)
          .eq('is_favorite', true)
          .order('usage_count', { ascending: false })
          .limit(20)

        if (savedMixes && data) {
          setMixes(savedMixes.map(m => ({
            id: m.id,
            lounge_id: data.id,
            name: m.name,
            description: m.notes || null,
            tobaccos: m.tobaccos || [],
            price: null,
            is_signature: m.is_favorite ?? false,
            popularity: m.usage_count ?? 0,
            created_at: m.created_at,
          })))
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load lounge profile')
      }
      setLoading(false)
    }

    fetchLounge()
  }, [user, isDemoMode, supabase])

  // Update lounge profile with optimistic update
  const updateLounge = useCallback(async (updates: Partial<LoungeProfile>) => {
    if (!lounge || !supabase || isDemoMode) return

    const prev = lounge
    setLounge({ ...lounge, ...updates, updated_at: new Date().toISOString() })

    // Strip client-only fields before sending to DB
    const { latitude, longitude, ...dbUpdates } = updates as Record<string, unknown>
    delete dbUpdates.id
    delete dbUpdates.profile_id
    delete dbUpdates.created_at

    const { error: updateErr } = await supabase
      .from('lounge_profiles')
      .update(dbUpdates)
      .eq('id', lounge.id)

    if (updateErr) {
      setLounge(prev)
      setError(updateErr.message)
    }
  }, [lounge, supabase, isDemoMode])

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
    id: 'pub-r1', name: 'Mojito', name_en: 'Mojito',
    description: 'Refreshing Cuban cocktail with mint and lime',
    method: 'muddle', glass: 'highball', garnish_description: 'Mint, lime', menu_price: 9,
    ingredients: ['White Rum', 'Lime Juice', 'Simple Syrup', 'Soda Water', 'Mint'],
  },
  {
    id: 'pub-r2', name: 'Negroni', name_en: 'Negroni',
    description: 'Italian classic with a bitter aftertaste',
    method: 'stir', glass: 'rocks', garnish_description: 'Orange slice', menu_price: 11,
    ingredients: ['Gin', 'Campari', 'Sweet Vermouth'],
  },
  {
    id: 'pub-r3', name: 'Aperol Spritz', name_en: 'Aperol Spritz',
    description: 'Italian aperitivo -- bitter, fresh, perfect on the terrace',
    method: 'build', glass: 'wine', garnish_description: 'Orange slice', menu_price: 9,
    ingredients: ['Aperol', 'Prosecco', 'Soda Water'],
  },
  {
    id: 'pub-r4', name: 'Espresso Martini', name_en: 'Espresso Martini',
    description: 'Coffee cocktail with vodka -- energy and flavor',
    method: 'shake', glass: 'coupe', garnish_description: 'Three coffee beans', menu_price: 11,
    ingredients: ['Vodka', 'Coffee Liqueur', 'Espresso'],
  },
  {
    id: 'pub-r5', name: 'Leipzig Sour', name_en: 'Leipzig Sour',
    description: 'Signature sour with sea buckthorn and honey -- our bestseller',
    method: 'shake', glass: 'coupe', garnish_description: 'Sea buckthorn, thyme', menu_price: 12,
    ingredients: ['Gin', 'Sea Buckthorn Syrup', 'Honey Syrup', 'Lemon Juice'],
  },
  {
    id: 'pub-r6', name: 'Moscow Mule', name_en: 'Moscow Mule',
    description: 'Vodka with ginger beer and lime in a copper mug',
    method: 'build', glass: 'copper_mug', garnish_description: 'Lime, ginger', menu_price: 9,
    ingredients: ['Vodka', 'Ginger Beer', 'Lime Juice'],
  },
  {
    id: 'pub-r7', name: 'Gin & Tonic', name_en: 'Gin & Tonic',
    description: 'Light long drink with botanicals',
    method: 'build', glass: 'highball', garnish_description: 'Lime wedge, rosemary', menu_price: 8,
    ingredients: ['Gin', 'Tonic'],
  },
  {
    id: 'pub-r8', name: 'Tropical Hookah', name_en: 'Tropical Hookah',
    description: 'Non-alcoholic tropical cocktail -- perfect with hookah',
    method: 'shake', glass: 'highball', garnish_description: 'Pineapple, umbrella', menu_price: 7,
    ingredients: ['Pineapple Juice', 'Passion Fruit Puree', 'Coconut Syrup', 'Lime Juice'],
  },
]

// Public table info for QR ordering
export interface PublicTable {
  id: string
  name: string
}

// Demo tables for demo-lounge
const DEMO_TABLES: PublicTable[] = [
  { id: '1', name: 'Table 1' },
  { id: '2', name: 'Table 2' },
  { id: '3', name: 'VIP' },
  { id: '4', name: 'Table 4' },
  { id: '5', name: 'Bar counter' },
]

// Tobacco menu item for public display
export interface PublicTobaccoGroup {
  brand: string
  flavors: string[]
}

// Demo tobacco menu
const DEMO_TOBACCO_MENU: PublicTobaccoGroup[] = [
  { brand: 'Musthave', flavors: ['Pinkman', 'Blueberry', 'Banana Mama', 'Milky Rice', 'Lemon-Lime', 'Grapefruit'] },
  { brand: 'Darkside', flavors: ['Supernova', 'Falling Star', 'Wild Forest', 'Dark Mint', 'Kalee Grap', 'Safari Melon'] },
  { brand: 'Tangiers', flavors: ['Cane Mint', 'Pineapple', 'Kashmir Peach', 'Orange Soda', 'Horchata', 'Maraschino Cherry'] },
  { brand: 'Al Fakher', flavors: ['Double Apple', 'Grape', 'Mint', 'Watermelon', 'Peach'] },
  { brand: 'Fumari', flavors: ['White Gummy Bear', 'Tropical Punch', 'Blueberry Muffin', 'Spiced Chai'] },
]

// Hook for public lounge viewing (by slug)
interface UsePublicLoungeReturn {
  lounge: LoungeProfile | null
  mixes: PublicMix[]
  barRecipes: PublicBarRecipe[]
  tobaccoMenu: PublicTobaccoGroup[]
  tables: PublicTable[]
  loading: boolean
  error: string | null
}

export function usePublicLounge(slug: string): UsePublicLoungeReturn {
  const [lounge, setLounge] = useState<LoungeProfile | null>(null)
  const [mixes, setMixes] = useState<PublicMix[]>([])
  const [barRecipes, setBarRecipes] = useState<PublicBarRecipe[]>([])
  const [tobaccoMenu, setTobaccoMenu] = useState<PublicTobaccoGroup[]>([])
  const [tables, setTables] = useState<PublicTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Demo slug returns demo data
    if (slug === 'demo-lounge') {
      setLounge(DEMO_LOUNGE)
      setMixes(DEMO_MIXES)
      setBarRecipes(DEMO_BAR_RECIPES)
      setTobaccoMenu(DEMO_TOBACCO_MENU)
      setTables(DEMO_TABLES)
      setLoading(false)
      return
    }

    // Fetch real venue from public API
    fetch(`/api/public/menu/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Venue not found')
        return res.json()
      })
      .then(data => {
        if (data.loungeProfile) {
          // Real lounge_profiles data from DB
          setLounge({
            ...data.loungeProfile,
            latitude: null,
            longitude: null,
            features: data.loungeProfile.features || [],
          })
        } else {
          // Fallback: build minimal profile from venue data (transition period)
          setLounge({
            id: `venue-${slug}`,
            profile_id: '',
            slug,
            name: data.venue.name || slug,
            description: null,
            logo_url: data.venue.logo_url,
            cover_image_url: null,
            city: null,
            address: null,
            latitude: null,
            longitude: null,
            phone: null,
            email: null,
            website: null,
            instagram: null,
            telegram: null,
            working_hours: null,
            features: [],
            is_published: true,
            show_menu: true,
            show_prices: true,
            show_popular_mixes: true,
            rating: null,
            reviews_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
        setBarRecipes(data.barRecipes || [])
        setTobaccoMenu(data.tobaccoMenu || [])
        setTables(data.tables || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Venue not found')
        setLoading(false)
      })
  }, [slug])

  return { lounge, mixes, barRecipes, tobaccoMenu, tables, loading, error }
}
