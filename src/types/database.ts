export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface Profile {
  id: string
  business_name: string | null
  owner_name: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
  created_at: string
}

export interface TobaccoInventory {
  id: string
  profile_id: string
  tobacco_id: string
  brand: string
  flavor: string
  quantity_grams: number
  purchase_price: number | null
  purchase_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BowlType {
  id: string
  profile_id: string
  name: string
  capacity_grams: number
  is_default: boolean
  created_at: string
}

export interface Session {
  id: string
  profile_id: string
  bowl_type_id: string | null
  session_date: string
  total_grams: number
  compatibility_score: number | null
  notes: string | null
  rating: number | null
  created_at?: string
}

export interface SessionItem {
  id: string
  session_id: string
  tobacco_inventory_id: string | null
  tobacco_id: string
  brand: string
  flavor: string
  grams_used: number
  percentage: number
}

export type TransactionType = 'purchase' | 'session' | 'waste' | 'adjustment'

export interface InventoryTransaction {
  id: string
  profile_id: string
  tobacco_inventory_id: string
  type: TransactionType
  quantity_grams: number
  session_id: string | null
  notes: string | null
  created_at: string
}

export interface NotificationSettings {
  id: string
  profile_id: string
  low_stock_enabled: boolean
  low_stock_threshold: number
  created_at: string
}

export interface SavedMixTobacco {
  tobacco_id: string
  brand: string
  flavor: string
  percent: number
  color: string
}

export interface SavedMix {
  id: string
  profile_id: string
  name: string
  tobaccos: SavedMixTobacco[]
  compatibility_score: number | null
  is_favorite: boolean
  usage_count: number
  created_at: string
}

export type StrengthPreference = 'light' | 'medium' | 'strong'
export type FlavorProfile = 'fresh' | 'fruity' | 'sweet' | 'citrus' | 'spicy' | 'soda'
export type PackingStyle = 'fluffy' | 'semi-dense' | 'dense'

/**
 * Immutable snapshot of a mix - never changes even if inventory/recipes change
 */
export interface MixSnapshot {
  id: string
  tobaccos: {
    tobacco_id: string
    brand: string
    flavor: string
    percent: number
    color: string
  }[]
  total_grams: number
  strength: StrengthPreference
  compatibility_score: number | null
  bowl_type: string | null
  heat_setup: {
    coals: number
    packing: PackingStyle
  }
  created_at: string
}

export interface Guest {
  id: string
  profile_id: string
  name: string
  phone: string | null
  photo_url: string | null
  notes: string | null
  strength_preference: StrengthPreference | null
  flavor_profiles: FlavorProfile[]
  last_mix_snapshot: MixSnapshot | null
  visit_count: number
  last_visit_at: string | null
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface SessionWithItems extends Session {
  session_items: SessionItem[]
  bowl_type: BowlType | null
}

export interface TobaccoInventoryWithTransactions extends TobaccoInventory {
  inventory_transactions: InventoryTransaction[]
}

// Database response types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      tobacco_inventory: {
        Row: TobaccoInventory
        Insert: Omit<TobaccoInventory, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<TobaccoInventory, 'id' | 'profile_id'>>
      }
      bowl_types: {
        Row: BowlType
        Insert: Omit<BowlType, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<BowlType, 'id' | 'profile_id'>>
      }
      sessions: {
        Row: Session
        Insert: Omit<Session, 'id'> & { id?: string }
        Update: Partial<Omit<Session, 'id' | 'profile_id'>>
      }
      session_items: {
        Row: SessionItem
        Insert: Omit<SessionItem, 'id'> & { id?: string }
        Update: Partial<Omit<SessionItem, 'id' | 'session_id'>>
      }
      inventory_transactions: {
        Row: InventoryTransaction
        Insert: Omit<InventoryTransaction, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<InventoryTransaction, 'id' | 'profile_id'>>
      }
      notification_settings: {
        Row: NotificationSettings
        Insert: Omit<NotificationSettings, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<NotificationSettings, 'id' | 'profile_id'>>
      }
      saved_mixes: {
        Row: SavedMix
        Insert: Omit<SavedMix, 'id' | 'created_at' | 'usage_count'> & { id?: string; created_at?: string; usage_count?: number }
        Update: Partial<Omit<SavedMix, 'id' | 'profile_id'>>
      }
      guests: {
        Row: Guest
        Insert: Omit<Guest, 'id' | 'created_at' | 'updated_at' | 'visit_count'> & { id?: string; created_at?: string; updated_at?: string; visit_count?: number }
        Update: Partial<Omit<Guest, 'id' | 'profile_id'>>
      }
    }
  }
}

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    inventory_items: 10,
    bowl_types: 1,
    session_history_days: 30,
    export: false,
    api_access: false,
  },
  pro: {
    inventory_items: Infinity,
    bowl_types: Infinity,
    session_history_days: Infinity,
    export: true,
    api_access: true,
  },
  enterprise: {
    inventory_items: Infinity,
    bowl_types: Infinity,
    session_history_days: Infinity,
    export: true,
    api_access: true,
  },
} as const
