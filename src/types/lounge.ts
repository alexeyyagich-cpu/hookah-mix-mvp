// Public lounge profile types - foundation for hookah lounge discovery platform

export interface LoungeProfile {
  id: string
  profile_id: string // owner's profile
  slug: string // URL-friendly name, e.g. "demo-lounge"

  // Basic info
  name: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null

  // Location
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null

  // Contact
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  telegram: string | null

  // Business hours
  working_hours: WorkingHours | null

  // Features
  features: LoungeFeature[]

  // Settings
  is_public: boolean
  show_menu: boolean
  show_prices: boolean
  show_popular_mixes: boolean

  // Stats (for discovery/ranking)
  rating: number | null
  reviews_count: number

  created_at: string
  updated_at: string
}

export interface WorkingHours {
  monday: DayHours | null
  tuesday: DayHours | null
  wednesday: DayHours | null
  thursday: DayHours | null
  friday: DayHours | null
  saturday: DayHours | null
  sunday: DayHours | null
}

export interface DayHours {
  open: string // "18:00"
  close: string // "06:00"
  is_closed?: boolean
}

export type LoungeFeature =
  | 'wifi'
  | 'parking'
  | 'terrace'
  | 'vip_rooms'
  | 'food'
  | 'alcohol'
  | 'live_music'
  | 'dj'
  | 'karaoke'
  | 'board_games'
  | 'playstation'
  | 'hookah_delivery'
  | 'reservations'

export const LOUNGE_FEATURES: Record<LoungeFeature, { label: string; icon: string }> = {
  wifi: { label: 'Wi-Fi', icon: '📶' },
  parking: { label: 'Парковка', icon: '🅿️' },
  terrace: { label: 'Терраса', icon: '🌿' },
  vip_rooms: { label: 'VIP-комнаты', icon: '👑' },
  food: { label: 'Кухня', icon: '🍽️' },
  alcohol: { label: 'Бар', icon: '🍸' },
  live_music: { label: 'Живая музыка', icon: '🎵' },
  dj: { label: 'DJ', icon: '🎧' },
  karaoke: { label: 'Караоке', icon: '🎤' },
  board_games: { label: 'Настолки', icon: '🎲' },
  playstation: { label: 'PlayStation', icon: '🎮' },
  hookah_delivery: { label: 'Доставка кальянов', icon: '🚗' },
  reservations: { label: 'Бронирование', icon: '📅' },
}

// Events for lounges (foundation for future)
export interface LoungeEvent {
  id: string
  lounge_id: string
  title: string
  description: string | null
  image_url: string | null
  event_date: string
  start_time: string
  end_time: string | null
  is_recurring: boolean
  recurrence_rule: string | null // RRULE format
  created_at: string
}

// Reviews (foundation for future)
export interface LoungeReview {
  id: string
  lounge_id: string
  user_id: string | null // null for anonymous
  author_name: string
  rating: number // 1-5
  text: string | null
  created_at: string
}

// City for discovery (foundation for future)
export interface City {
  id: string
  name: string
  country: string
  slug: string
  lounges_count: number
  latitude: number
  longitude: number
}

// Public bar recipe for cocktail menu display
export interface PublicBarRecipe {
  id: string
  name: string
  name_en: string | null
  description: string | null
  method: string | null
  glass: string | null
  garnish_description: string | null
  menu_price: number | null
  ingredients: string[] // ingredient names only
}

// Public mix for menu display
export interface PublicMix {
  id: string
  lounge_id: string
  name: string
  description: string | null
  tobaccos: {
    brand: string
    flavor: string
    percent: number
    color: string
  }[]
  price: number | null
  is_signature: boolean // featured/signature mix
  popularity: number // order count
  created_at: string
}
