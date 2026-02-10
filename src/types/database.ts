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
  package_grams: number | null  // Size of package the price applies to (25, 100, 250)
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
      suppliers: {
        Row: Supplier
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Supplier, 'id'>>
      }
      supplier_products: {
        Row: SupplierProduct
        Insert: Omit<SupplierProduct, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<SupplierProduct, 'id' | 'supplier_id'>>
      }
      marketplace_orders: {
        Row: MarketplaceOrder
        Insert: Omit<MarketplaceOrder, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<MarketplaceOrder, 'id' | 'profile_id'>>
      }
      marketplace_order_items: {
        Row: MarketplaceOrderItem
        Insert: Omit<MarketplaceOrderItem, 'id'> & { id?: string }
        Update: Partial<Omit<MarketplaceOrderItem, 'id' | 'order_id'>>
      }
      auto_reorder_rules: {
        Row: AutoReorderRule
        Insert: Omit<AutoReorderRule, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<AutoReorderRule, 'id' | 'profile_id'>>
      }
    }
  }
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Supplier {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  logo_url: string | null
  description: string | null
  min_order_amount: number
  delivery_days_min: number
  delivery_days_max: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  tobacco_id: string
  brand: string
  flavor: string
  sku: string | null
  price: number
  package_grams: number
  in_stock: boolean
  created_at: string
}

export interface MarketplaceOrder {
  id: string
  profile_id: string
  supplier_id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  total: number
  notes: string | null
  estimated_delivery_date: string | null
  actual_delivery_date: string | null
  is_auto_order: boolean
  created_at: string
}

export interface MarketplaceOrderItem {
  id: string
  order_id: string
  supplier_product_id: string | null
  tobacco_id: string
  brand: string
  flavor: string
  quantity: number
  unit_price: number
  package_grams: number
  total_price: number
}

export interface AutoReorderRule {
  id: string
  profile_id: string
  tobacco_inventory_id: string
  supplier_product_id: string
  threshold_grams: number
  reorder_quantity: number
  is_enabled: boolean
  last_triggered_at: string | null
  created_at: string
}

// Extended marketplace types with relations
export interface SupplierWithProducts extends Supplier {
  products: SupplierProduct[]
}

export interface MarketplaceOrderWithItems extends MarketplaceOrder {
  supplier: Supplier
  order_items: MarketplaceOrderItem[]
}

// Cart types (client-side only, uses localStorage)
export interface CartItem {
  product: SupplierProduct
  quantity: number
}

export interface Cart {
  supplier: Supplier
  items: CartItem[]
  subtotal: number
}

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    inventory_items: 10,
    bowl_types: 1,
    session_history_days: 30,
    export: false,
    api_access: false,
    marketplace: false,
    auto_reorder: false,
  },
  pro: {
    inventory_items: Infinity,
    bowl_types: Infinity,
    session_history_days: Infinity,
    export: true,
    api_access: true,
    marketplace: true,
    auto_reorder: false,
  },
  enterprise: {
    inventory_items: Infinity,
    bowl_types: Infinity,
    session_history_days: Infinity,
    export: true,
    api_access: true,
    marketplace: true,
    auto_reorder: true,
  },
} as const
