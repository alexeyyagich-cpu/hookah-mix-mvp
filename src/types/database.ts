export type SubscriptionTier = 'trial' | 'core' | 'pro' | 'multi' | 'enterprise'

// Organization roles (multi-tenant system)
export type OrgRole = 'owner' | 'manager' | 'hookah_master' | 'bartender' | 'cook'

// Module system - switchable feature areas
export type AppModule = 'hookah' | 'bar' | 'kitchen'

// Business type — selected during onboarding
export type BusinessType = 'hookah' | 'bar' | 'hookah_bar' | 'restaurant'

export type OnboardingStep = 'welcome' | 'business_type' | 'business' | 'setup' | 'complete' | 'bowl' | 'tobacco'

export interface Profile {
  id: string
  business_name: string | null
  owner_name: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
  role: string
  // For staff: reference to the owner's profile they belong to
  owner_profile_id: string | null
  // For guests: venue slug they registered through
  venue_slug: string | null
  // Stripe integration
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  // Trial
  trial_expires_at: string | null
  // Onboarding state
  onboarding_completed: boolean
  onboarding_skipped: boolean
  onboarding_step: OnboardingStep | null
  // Business type selected during onboarding
  business_type: BusinessType | null
  // Active modules for this venue
  active_modules: AppModule[]
  // UI locale preference
  locale: string | null
  created_at: string
}

// ============================================================================
// Multi-tenant types
// ============================================================================

export interface Organization {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
  trial_expires_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  organization_id: string
  name: string
  slug: string | null
  address: string | null
  phone: string | null
  locale: string
  timezone: string
  active_modules: string[]
  business_type: BusinessType | null
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  organization_id: string
  location_id: string | null
  user_id: string
  role: OrgRole
  display_name: string | null
  is_active: boolean
  hourly_rate: number
  sales_commission_percent: number
  created_at: string
  updated_at: string
}

export interface InviteToken {
  id: string
  organization_id: string
  location_id: string | null
  email: string
  role: OrgRole
  token: string
  invited_by: string
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
  created_at: string
}

export interface TobaccoInventory {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
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
  organization_id?: string | null
  location_id?: string | null
  name: string
  capacity_grams: number
  is_default: boolean
  created_at: string
}

export interface Session {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  created_by: string | null
  guest_id: string | null
  bowl_type_id: string | null
  session_date: string
  total_grams: number
  compatibility_score: number | null
  notes: string | null
  rating: number | null
  duration_minutes: number | null
  selling_price: number | null
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
  organization_id?: string | null
  location_id?: string | null
  tobacco_inventory_id: string
  type: TransactionType
  quantity_grams: number
  session_id: string | null
  notes: string | null
  idempotency_key: string | null
  created_at: string
}

export interface NotificationSettings {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
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
  organization_id?: string | null
  name: string
  tobaccos: SavedMixTobacco[]
  compatibility_score: number | null
  is_favorite: boolean
  usage_count: number
  rating: number | null // 1-5 stars
  notes: string | null // User notes about the mix
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

export type LoyaltyTier = 'bronze' | 'silver' | 'gold'

export interface Guest {
  id: string
  profile_id: string
  organization_id?: string | null
  name: string
  phone: string | null
  photo_url: string | null
  notes: string | null
  strength_preference: StrengthPreference | null
  flavor_profiles: FlavorProfile[]
  last_mix_snapshot: MixSnapshot | null
  visit_count: number
  last_visit_at: string | null
  bonus_balance: number
  discount_percent: number
  total_spent: number
  loyalty_tier: LoyaltyTier
  created_at: string
  updated_at: string
}

export interface LoyaltySettings {
  id: string
  profile_id: string
  organization_id?: string | null
  bonus_accrual_percent: number
  bonus_max_redemption_percent: number
  tier_silver_threshold: number
  tier_gold_threshold: number
  tier_silver_discount: number
  tier_gold_discount: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface BonusTransaction {
  id: string
  guest_id: string
  profile_id: string
  organization_id?: string | null
  type: 'accrual' | 'redemption' | 'manual'
  amount: number
  balance_after: number
  related_session_id: string | null
  description: string | null
  created_at: string
}

// ============================================================================
// PROMOTIONS TYPES
// ============================================================================

export type PromoType = 'happy_hour' | 'nth_free' | 'birthday' | 'custom_discount'

export interface PromoRules {
  discount_percent?: number
  start_hour?: number
  end_hour?: number
  nth_visit?: number
  days_of_week?: number[]
}

export interface Promotion {
  id: string
  profile_id: string
  organization_id?: string | null
  name: string
  type: PromoType
  rules: PromoRules
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  usage_count: number
  max_uses: number | null
  created_at: string
  updated_at: string
}

// ============================================================================
// QR TIPS TYPES
// ============================================================================

export interface StaffProfile {
  id: string
  profile_id: string
  organization_id?: string | null
  org_member_id: string
  display_name: string
  photo_url: string | null
  tip_slug: string
  is_tip_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Tip {
  id: string
  staff_profile_id: string
  amount: number
  currency: string
  stripe_payment_intent_id: string | null
  status: 'pending' | 'completed' | 'failed'
  payer_name: string | null
  message: string | null
  created_at: string
}

// ============================================================================
// REVIEWS TYPES
// ============================================================================

export interface Review {
  id: string
  profile_id: string
  organization_id?: string | null
  author_name: string
  rating: number  // 1-5
  text: string | null
  is_published: boolean
  created_at: string
}

// ============================================================================
// RESERVATIONS TYPES
// ============================================================================

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ReservationSource = 'online' | 'phone' | 'walk_in'

export interface Reservation {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  table_id: string | null
  guest_name: string
  guest_phone: string | null
  guest_count: number
  reservation_date: string  // YYYY-MM-DD
  reservation_time: string  // HH:MM
  duration_minutes: number
  status: ReservationStatus
  notes: string | null
  source: ReservationSource
  created_at: string
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
export type TableShape = 'circle' | 'square' | 'rectangle'

export interface FloorTable {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  name: string
  capacity: number
  shape: TableShape
  position_x: number
  position_y: number
  width: number
  height: number
  status: TableStatus
  current_session_id: string | null
  current_guest_name: string | null
  session_start_time: string | null
  zone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface SessionWithItems extends Session {
  session_items: SessionItem[]
  bowl_type: BowlType | null
}

export interface PushSubscription {
  id: string
  profile_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface TelegramConnectionRow {
  id: string
  profile_id: string
  telegram_user_id: number
  telegram_username: string | null
  chat_id: number
  is_active: boolean
  notifications_enabled: boolean
  low_stock_alerts: boolean
  session_reminders: boolean
  daily_summary: boolean
  created_at: string
  updated_at: string
}

export interface EmailSettingsRow {
  id: string
  profile_id: string
  email_notifications_enabled: boolean
  low_stock_email: boolean
  order_updates_email: boolean
  daily_summary_email: boolean
  marketing_email: boolean
  created_at: string
  updated_at: string
}

export interface SystemSuperadmin {
  id: string
  user_id: string
}

// Flattens interface → plain mapped type so it satisfies Record<string, unknown>.
// Required because TS interfaces lack the implicit index signature that GenericTable needs.
type S<T> = { [K in keyof T]: T[K] }

// Auto-generate Insert type: nullable fields become optional, auto-generated fields become optional
type Ins<T, Auto extends keyof T = never> = S<
  { [K in keyof T as K extends Auto ? never : null extends T[K] ? never : K]: T[K] }
  & { [K in keyof T as K extends Auto ? never : null extends T[K] ? K : never]?: T[K] }
  & { [K in Auto]?: T[K] }
>

// Database response types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: S<Profile>
        Insert: Ins<Profile, 'created_at'>
        Update: S<Partial<Omit<Profile, 'id'>>>
        Relationships: []
      }
      tobacco_inventory: {
        Row: S<TobaccoInventory>
        Insert: Ins<TobaccoInventory, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<TobaccoInventory, 'id' | 'profile_id'>>>
        Relationships: []
      }
      bowl_types: {
        Row: S<BowlType>
        Insert: Ins<BowlType, 'id' | 'created_at'>
        Update: S<Partial<Omit<BowlType, 'id' | 'profile_id'>>>
        Relationships: []
      }
      sessions: {
        Row: S<Session>
        Insert: Ins<Session, 'id'>
        Update: S<Partial<Omit<Session, 'id' | 'profile_id'>>>
        Relationships: []
      }
      session_items: {
        Row: S<SessionItem>
        Insert: Ins<SessionItem, 'id'>
        Update: S<Partial<Omit<SessionItem, 'id' | 'session_id'>>>
        Relationships: []
      }
      inventory_transactions: {
        Row: S<InventoryTransaction>
        Insert: Ins<InventoryTransaction, 'id' | 'created_at'>
        Update: S<Partial<Omit<InventoryTransaction, 'id' | 'profile_id'>>>
        Relationships: []
      }
      notification_settings: {
        Row: S<NotificationSettings>
        Insert: Ins<NotificationSettings, 'id' | 'created_at'>
        Update: S<Partial<Omit<NotificationSettings, 'id' | 'profile_id'>>>
        Relationships: []
      }
      saved_mixes: {
        Row: S<SavedMix>
        Insert: Ins<SavedMix, 'id' | 'created_at' | 'usage_count'>
        Update: S<Partial<Omit<SavedMix, 'id' | 'profile_id'>>>
        Relationships: []
      }
      guests: {
        Row: S<Guest>
        Insert: Ins<Guest, 'id' | 'created_at' | 'updated_at' | 'visit_count'>
        Update: S<Partial<Omit<Guest, 'id' | 'profile_id'>>>
        Relationships: []
      }
      suppliers: {
        Row: S<Supplier>
        Insert: Ins<Supplier, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<Supplier, 'id'>>>
        Relationships: []
      }
      supplier_products: {
        Row: S<SupplierProduct>
        Insert: Ins<SupplierProduct, 'id' | 'created_at'>
        Update: S<Partial<Omit<SupplierProduct, 'id' | 'supplier_id'>>>
        Relationships: []
      }
      marketplace_orders: {
        Row: S<MarketplaceOrder>
        Insert: Ins<MarketplaceOrder, 'id' | 'created_at'>
        Update: S<Partial<Omit<MarketplaceOrder, 'id' | 'profile_id'>>>
        Relationships: []
      }
      marketplace_order_items: {
        Row: S<MarketplaceOrderItem>
        Insert: Ins<MarketplaceOrderItem, 'id'>
        Update: S<Partial<Omit<MarketplaceOrderItem, 'id' | 'order_id'>>>
        Relationships: []
      }
      auto_reorder_rules: {
        Row: S<AutoReorderRule>
        Insert: Ins<AutoReorderRule, 'id' | 'created_at'>
        Update: S<Partial<Omit<AutoReorderRule, 'id' | 'profile_id'>>>
        Relationships: []
      }
      reviews: {
        Row: S<Review>
        Insert: Ins<Review, 'id' | 'created_at' | 'is_published'>
        Update: S<Partial<Omit<Review, 'id' | 'profile_id'>>>
        Relationships: []
      }
      reservations: {
        Row: S<Reservation>
        Insert: Ins<Reservation, 'id' | 'created_at' | 'status' | 'duration_minutes'>
        Update: S<Partial<Omit<Reservation, 'id' | 'profile_id'>>>
        Relationships: []
      }
      r2o_connections: {
        Row: S<R2OConnection>
        Insert: Ins<R2OConnection, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<R2OConnection, 'id' | 'profile_id'>>>
        Relationships: []
      }
      r2o_product_mappings: {
        Row: S<R2OProductMapping>
        Insert: Ins<R2OProductMapping, 'id' | 'created_at'>
        Update: S<Partial<Omit<R2OProductMapping, 'id' | 'profile_id'>>>
        Relationships: []
      }
      r2o_sales_log: {
        Row: S<R2OSalesLog>
        Insert: Ins<R2OSalesLog, 'id' | 'created_at'>
        Update: S<Partial<Omit<R2OSalesLog, 'id' | 'profile_id'>>>
        Relationships: []
      }
      bar_inventory: {
        Row: S<BarInventoryItem>
        Insert: Ins<BarInventoryItem, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<BarInventoryItem, 'id' | 'profile_id'>>>
        Relationships: []
      }
      bar_transactions: {
        Row: S<BarTransaction>
        Insert: Ins<BarTransaction, 'id' | 'created_at'>
        Update: S<Partial<Omit<BarTransaction, 'id' | 'profile_id'>>>
        Relationships: []
      }
      bar_recipes: {
        Row: S<BarRecipe>
        Insert: Ins<BarRecipe, 'id' | 'created_at' | 'updated_at' | 'is_on_menu' | 'is_favorite'>
        Update: S<Partial<Omit<BarRecipe, 'id' | 'profile_id'>>>
        Relationships: []
      }
      bar_recipe_ingredients: {
        Row: S<BarRecipeIngredient>
        Insert: Ins<BarRecipeIngredient, 'id' | 'created_at' | 'is_optional' | 'sort_order'>
        Update: S<Partial<Omit<BarRecipeIngredient, 'id' | 'recipe_id'>>>
        Relationships: []
      }
      bar_sales: {
        Row: S<BarSale>
        Insert: Ins<BarSale, 'id' | 'sold_at'>
        Update: S<Partial<Omit<BarSale, 'id' | 'profile_id'>>>
        Relationships: []
      }
      kds_orders: {
        Row: S<KdsOrder>
        Insert: Ins<KdsOrder, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'status'>
        Update: S<Partial<Omit<KdsOrder, 'id' | 'profile_id'>>>
        Relationships: []
      }
      shifts: {
        Row: S<Shift>
        Insert: Ins<Shift, 'id' | 'created_at' | 'updated_at' | 'closed_at' | 'status'>
        Update: S<Partial<Omit<Shift, 'id' | 'profile_id'>>>
        Relationships: []
      }
      floor_tables: {
        Row: S<FloorTable>
        Insert: Ins<FloorTable, 'id' | 'created_at' | 'updated_at' | 'status'>
        Update: S<Partial<Omit<FloorTable, 'id' | 'profile_id'>>>
        Relationships: []
      }
      organizations: {
        Row: S<Organization>
        Insert: Ins<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<Organization, 'id'>>>
        Relationships: []
      }
      locations: {
        Row: S<Location>
        Insert: Ins<Location, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<Location, 'id' | 'organization_id'>>>
        Relationships: []
      }
      org_members: {
        Row: S<OrgMember>
        Insert: Ins<OrgMember, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<OrgMember, 'id' | 'organization_id' | 'user_id'>>>
        Relationships: []
      }
      invite_tokens: {
        Row: S<InviteToken>
        Insert: Ins<InviteToken, 'id' | 'created_at'>
        Update: S<Partial<Omit<InviteToken, 'id' | 'organization_id'>>>
        Relationships: []
      }
      promotions: {
        Row: S<Promotion>
        Insert: Ins<Promotion, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
        Update: S<Partial<Omit<Promotion, 'id' | 'profile_id'>>>
        Relationships: []
      }
      staff_profiles: {
        Row: S<StaffProfile>
        Insert: Ins<StaffProfile, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<StaffProfile, 'id' | 'profile_id'>>>
        Relationships: []
      }
      tips: {
        Row: S<Tip>
        Insert: Ins<Tip, 'id' | 'created_at'>
        Update: S<Partial<Omit<Tip, 'id' | 'staff_profile_id'>>>
        Relationships: []
      }
      bonus_transactions: {
        Row: S<BonusTransaction>
        Insert: Ins<BonusTransaction, 'id' | 'created_at'>
        Update: S<Partial<Omit<BonusTransaction, 'id' | 'guest_id' | 'profile_id'>>>
        Relationships: []
      }
      loyalty_settings: {
        Row: S<LoyaltySettings>
        Insert: Ins<LoyaltySettings, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<LoyaltySettings, 'id' | 'profile_id'>>>
        Relationships: []
      }
      push_subscriptions: {
        Row: S<PushSubscription>
        Insert: Ins<PushSubscription, 'id' | 'created_at'>
        Update: S<Partial<Omit<PushSubscription, 'id' | 'profile_id'>>>
        Relationships: []
      }
      telegram_connections: {
        Row: S<TelegramConnectionRow>
        Insert: Ins<TelegramConnectionRow, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<TelegramConnectionRow, 'id' | 'profile_id'>>>
        Relationships: []
      }
      email_settings: {
        Row: S<EmailSettingsRow>
        Insert: Ins<EmailSettingsRow, 'id' | 'created_at' | 'updated_at'>
        Update: S<Partial<Omit<EmailSettingsRow, 'id' | 'profile_id'>>>
        Relationships: []
      }
      system_superadmins: {
        Row: S<SystemSuperadmin>
        Insert: Ins<SystemSuperadmin, 'id'>
        Update: S<Partial<Omit<SystemSuperadmin, 'id'>>>
        Relationships: []
      }
      lounge_profiles: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required by Supabase GenericSchema
    Views: {}
    Functions: {
      decrement_tobacco_inventory: {
        Args: { p_inventory_id: string; p_grams_used: number }
        Returns: undefined
      }
      adjust_bar_inventory: {
        Args: { p_inventory_id: string; p_quantity_change: number }
        Returns: undefined
      }
      setup_organization: {
        Args: { p_name: string; p_type: string; p_slug: string }
        Returns: unknown
      }
      lookup_invite: {
        Args: { p_token: string }
        Returns: unknown
      }
      accept_invite: {
        Args: { p_token: string }
        Returns: unknown
      }
      user_has_org_role: {
        Args: { p_org_id: string; p_roles: string[] }
        Returns: boolean
      }
      dashboard_control_snapshot: {
        Args: { p_org_id: string | null; p_profile_id: string | null; p_date: string }
        Returns: unknown
      }
    }
  }
}

// ============================================================================
// SHIFTS & RECONCILIATION TYPES
// ============================================================================

export type ShiftStatus = 'open' | 'closed'

export interface Shift {
  id: string
  profile_id: string
  organization_id: string | null
  location_id: string | null
  opened_by: string
  opened_by_name?: string | null
  opened_at: string
  closed_at: string | null
  starting_cash: number | null
  closing_cash: number | null
  open_notes: string | null
  close_notes: string | null
  status: ShiftStatus
  created_at: string
  updated_at: string
}

export interface ShiftReconciliation {
  hookah: {
    sessionsCount: number
    totalGrams: number
    avgCompatibility: number | null
    topTobaccos: { brand: string; flavor: string; grams: number }[]
    tobaccoCost: number
    revenue: number
    profit: number
  }
  bar: {
    salesCount: number
    totalRevenue: number
    totalCost: number
    profit: number
    marginPercent: number | null
    topCocktails: { name: string; count: number; revenue: number }[]
  }
  kds: {
    totalOrders: number
    byStatus: Record<string, number>
    avgCompletionMinutes: number | null
  }
  cash: {
    startingCash: number
    barRevenue: number
    hookahRevenue: number
    expectedCash: number
    actualCash: number | null
    difference: number | null
  }
  payroll: {
    staffName: string | null
    hoursWorked: number
    hourlyRate: number
    basePay: number
    commissionPercent: number
    commissionPay: number
    totalPay: number
  } | null
  tips: {
    count: number
    total: number
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
  organization_id?: string | null
  tobacco_inventory_id: string
  supplier_product_id: string
  threshold_grams: number
  reorder_quantity: number
  is_enabled: boolean
  last_triggered_at: string | null
  created_at: string
}

// ============================================================================
// READY2ORDER (POS) TYPES
// ============================================================================

export type R2OConnectionStatus = 'connected' | 'disconnected' | 'error'
export type R2OSyncStatus = 'synced' | 'pending' | 'error'

export interface R2OConnection {
  id: string
  profile_id: string
  encrypted_token: string
  token_iv: string
  status: R2OConnectionStatus
  webhook_registered: boolean
  product_group_id: number | null
  r2o_account_id: string | null
  webhook_id: number | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface R2OProductMapping {
  id: string
  profile_id: string
  tobacco_inventory_id: string
  r2o_product_id: number
  r2o_product_name: string
  sync_status: R2OSyncStatus
  last_synced_at: string | null
  created_at: string
}

export interface R2OSalesLog {
  id: string
  profile_id: string
  r2o_invoice_id: number
  invoice_number: string
  invoice_timestamp: string
  total_price: number
  items: unknown[]
  processed: boolean
  created_at: string
}

// ============================================================================
// BAR MODULE TYPES
// ============================================================================

export type BarIngredientCategory =
  | 'spirit' | 'liqueur' | 'wine' | 'beer'
  | 'mixer' | 'syrup' | 'juice' | 'bitter'
  | 'garnish' | 'ice' | 'other'

export type BarUnitType = 'ml' | 'g' | 'pcs'

// Bartender-specific portion units (used in recipes, converted to base units)
export type BarPortionUnit =
  | 'ml' | 'g' | 'pcs'
  | 'oz' | 'cl'
  | 'dash' | 'barspoon' | 'drop'
  | 'slice' | 'sprig' | 'wedge' | 'twist'

export type BarTransactionType = 'purchase' | 'sale' | 'waste' | 'adjustment'

export interface BarInventoryItem {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  name: string
  brand: string | null
  category: BarIngredientCategory
  unit_type: BarUnitType
  quantity: number
  min_quantity: number
  purchase_price: number | null
  package_size: number
  supplier_name: string | null
  barcode: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BarTransaction {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  bar_inventory_id: string
  type: BarTransactionType
  quantity: number
  unit_type: BarUnitType
  related_sale_id: string | null
  notes: string | null
  created_at: string
}

export type CocktailMethod = 'build' | 'stir' | 'shake' | 'blend' | 'layer' | 'muddle'

export type CocktailCategory = 'classic' | 'tiki' | 'sour' | 'highball' | 'shot' | 'hot' | 'non_alcoholic' | 'smoothie' | 'signature'

export interface BarRecipe {
  id: string
  profile_id: string
  organization_id?: string | null
  name: string
  name_en: string | null
  description: string | null
  method: CocktailMethod | null
  glass: string | null
  garnish_description: string | null
  menu_price: number | null
  is_on_menu: boolean
  is_favorite: boolean
  image_url: string | null
  serving_size_ml: number | null
  prep_time_seconds: number | null
  difficulty: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BarRecipeIngredient {
  id: string
  recipe_id: string
  bar_inventory_id: string | null
  ingredient_name: string
  quantity: number
  unit: BarPortionUnit
  is_optional: boolean
  sort_order: number
  created_at: string
}

export interface BarRecipeWithIngredients extends BarRecipe {
  ingredients: BarRecipeIngredient[]
}

export interface RecipeCostBreakdown {
  ingredient_name: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  in_stock: boolean
}

export interface RecipeCost {
  recipe_id: string
  total_cost: number
  menu_price: number | null
  margin: number | null
  ingredients: RecipeCostBreakdown[]
  all_in_stock: boolean
}

// ============================================================================
// BAR SALES TYPES
// ============================================================================

export interface BarSale {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  recipe_id: string | null
  recipe_name: string
  quantity: number
  unit_price: number
  total_revenue: number
  total_cost: number
  margin_percent: number | null
  table_id: string | null
  guest_name: string | null
  notes: string | null
  sold_at: string
}

export interface BarAnalytics {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  totalSales: number
  avgMargin: number | null
  topCocktails: { name: string; count: number; revenue: number }[]
  revenueByDay: { date: string; revenue: number; cost: number }[]
  costByCategory: { category: string; cost: number }[]
}

// ============================================================================
// KDS (KITCHEN DISPLAY SYSTEM) TYPES
// ============================================================================

export type KdsOrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type KdsOrderType = 'bar' | 'hookah'

export interface KdsHookahTobacco {
  tobacco_id: string
  brand: string
  flavor: string
  percent: number
  color: string
}

export interface KdsHookahData {
  tobaccos: KdsHookahTobacco[]
  total_grams: number
  bowl_name: string | null
  bowl_id: string | null
  heat_setup: { coals: number; packing: PackingStyle } | null
  strength: StrengthPreference | null
  compatibility_score: number | null
}

export interface KdsOrderItem {
  name: string
  quantity: number
  details: string | null
  hookah_data?: KdsHookahData | null
}

export interface KdsOrder {
  id: string
  profile_id: string
  organization_id?: string | null
  location_id?: string | null
  created_by: string | null
  table_id: string | null
  table_name: string | null
  guest_name: string | null
  type: KdsOrderType
  items: KdsOrderItem[]
  status: KdsOrderStatus
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  source: 'staff' | 'guest_qr'
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

// Subscription limits — single source of truth
// trial = same as core (full access for 14 days)
// core = single-location hookah lounge (€79/mo)
// multi = multi-location + CRM + waiter + analytics (€149/mo)
// enterprise = multi + API + custom integrations (from €299/mo)
const CORE_LIMITS = {
  inventory_items: Infinity,
  bowl_types: Infinity,
  session_history_days: Infinity,
  export: true,
  api_access: false,
  marketplace: false,
  auto_reorder: false,
  pos_integration: true,
  guest_qr_ordering: true,
  bar_module: true,
  bar_inventory_items: Infinity,
  max_locations: 1,
  crm: false,
  waiter_tablet: false,
  financial_reports: false,
} as const

const PRO_LIMITS = {
  inventory_items: Infinity,
  bowl_types: Infinity,
  session_history_days: Infinity,
  export: true,
  api_access: false,
  marketplace: false,
  auto_reorder: false,
  pos_integration: true,
  guest_qr_ordering: true,
  bar_module: true,
  bar_inventory_items: Infinity,
  max_locations: 1,
  crm: true,
  waiter_tablet: true,
  financial_reports: true,
} as const

const MULTI_LIMITS = {
  inventory_items: Infinity,
  bowl_types: Infinity,
  session_history_days: Infinity,
  export: true,
  api_access: true,
  marketplace: true,
  auto_reorder: true,
  pos_integration: true,
  guest_qr_ordering: true,
  bar_module: true,
  bar_inventory_items: Infinity,
  max_locations: Infinity,
  crm: true,
  waiter_tablet: true,
  financial_reports: true,
} as const

export const SUBSCRIPTION_LIMITS = {
  trial: CORE_LIMITS,
  core: CORE_LIMITS,
  pro: PRO_LIMITS,
  multi: MULTI_LIMITS,
  enterprise: MULTI_LIMITS,
} as const

// =============================================================================
// SUPER-ADMIN TYPES
// =============================================================================

export interface AdminOrganization extends Organization {
  member_count: number
  location_count: number
  last_activity: string | null
  owner_email: string | null
  owner_name: string | null
}

export interface AdminStats {
  total_orgs: number
  orgs_by_tier: Record<SubscriptionTier, number>
  active_orgs_7d: number
  mrr: number
  trials_expiring_7d: number
  recent_signups_30d: number
  trial_to_paid_rate: number
  total_users: number
}

export interface AdminOrgDetail extends AdminOrganization {
  members: OrgMember[]
  locations: Location[]
  sessions_count: number
  bar_sales_count: number
}
