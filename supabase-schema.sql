-- Hookah Mix Business Dashboard - Supabase Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PROFILES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_skipped BOOLEAN DEFAULT false,
  onboarding_step TEXT DEFAULT 'welcome' CHECK (onboarding_step IN ('welcome', 'business', 'bowl', 'tobacco', 'complete')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===========================================
-- TOBACCO INVENTORY TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tobacco_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  tobacco_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  flavor TEXT NOT NULL,
  quantity_grams DECIMAL NOT NULL DEFAULT 0,
  purchase_price DECIMAL,
  package_grams DECIMAL DEFAULT 100,  -- Size of package the price applies to (25, 100, 250)
  purchase_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tobacco_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for tobacco_inventory
CREATE POLICY "Users can view own inventory" ON public.tobacco_inventory
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own inventory" ON public.tobacco_inventory
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own inventory" ON public.tobacco_inventory
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own inventory" ON public.tobacco_inventory
  FOR DELETE USING (auth.uid() = profile_id);

-- Index for faster queries
CREATE INDEX idx_tobacco_inventory_profile_id ON public.tobacco_inventory(profile_id);

-- ===========================================
-- BOWL TYPES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.bowl_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  capacity_grams DECIMAL NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bowl_types ENABLE ROW LEVEL SECURITY;

-- Policies for bowl_types
CREATE POLICY "Users can view own bowls" ON public.bowl_types
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own bowls" ON public.bowl_types
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own bowls" ON public.bowl_types
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own bowls" ON public.bowl_types
  FOR DELETE USING (auth.uid() = profile_id);

-- Index for faster queries
CREATE INDEX idx_bowl_types_profile_id ON public.bowl_types(profile_id);

-- ===========================================
-- SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  bowl_type_id UUID REFERENCES public.bowl_types ON DELETE SET NULL,
  session_date TIMESTAMPTZ DEFAULT NOW(),
  total_grams DECIMAL NOT NULL,
  compatibility_score INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policies for sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own sessions" ON public.sessions
  FOR DELETE USING (auth.uid() = profile_id);

-- Indexes for faster queries
CREATE INDEX idx_sessions_profile_id ON public.sessions(profile_id);
CREATE INDEX idx_sessions_session_date ON public.sessions(session_date DESC);

-- ===========================================
-- SESSION ITEMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions ON DELETE CASCADE NOT NULL,
  tobacco_inventory_id UUID REFERENCES public.tobacco_inventory ON DELETE SET NULL,
  tobacco_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  flavor TEXT NOT NULL,
  grams_used DECIMAL NOT NULL,
  percentage INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE public.session_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage session items through sessions
CREATE POLICY "Users can view own session items" ON public.session_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_items.session_id
      AND sessions.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session items" ON public.session_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_items.session_id
      AND sessions.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session items" ON public.session_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_items.session_id
      AND sessions.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session items" ON public.session_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_items.session_id
      AND sessions.profile_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX idx_session_items_session_id ON public.session_items(session_id);

-- ===========================================
-- INVENTORY TRANSACTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  tobacco_inventory_id UUID REFERENCES public.tobacco_inventory ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'session', 'waste', 'adjustment')),
  quantity_grams DECIMAL NOT NULL,
  session_id UUID REFERENCES public.sessions ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_transactions
CREATE POLICY "Users can view own transactions" ON public.inventory_transactions
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own transactions" ON public.inventory_transactions
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own transactions" ON public.inventory_transactions
  FOR DELETE USING (auth.uid() = profile_id);

-- Indexes for faster queries
CREATE INDEX idx_inventory_transactions_profile_id ON public.inventory_transactions(profile_id);
CREATE INDEX idx_inventory_transactions_tobacco_id ON public.inventory_transactions(tobacco_inventory_id);
CREATE INDEX idx_inventory_transactions_created_at ON public.inventory_transactions(created_at DESC);

-- ===========================================
-- FUNCTION: Auto-create profile on user signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, owner_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'owner_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- FUNCTION: Update updated_at timestamp
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tobacco_inventory updated_at
DROP TRIGGER IF EXISTS update_tobacco_inventory_updated_at ON public.tobacco_inventory;
CREATE TRIGGER update_tobacco_inventory_updated_at
  BEFORE UPDATE ON public.tobacco_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- SAMPLE DATA (Optional - comment out for production)
-- ===========================================
-- This inserts sample data for testing. Remove or comment out for production.

-- Note: To use this, you'll need to have a user created first.
-- The profile will be auto-created by the trigger above.
-- Then you can insert sample data like:

-- INSERT INTO public.bowl_types (profile_id, name, capacity_grams, is_default)
-- VALUES
--   ('YOUR-USER-UUID', 'Phunnel средний', 20, true),
--   ('YOUR-USER-UUID', 'Turka', 18, false);

-- INSERT INTO public.tobacco_inventory (profile_id, tobacco_id, brand, flavor, quantity_grams)
-- VALUES
--   ('YOUR-USER-UUID', 'mh1', 'Musthave', 'Pinkman', 250),
--   ('YOUR-USER-UUID', 'ds1', 'Darkside', 'Supernova', 100);

-- ===========================================
-- NOTIFICATION SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE UNIQUE NOT NULL,
  low_stock_enabled BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies for notification_settings
CREATE POLICY "Users can view own notification settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own notification settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = profile_id);

-- Index for faster queries
CREATE INDEX idx_notification_settings_profile_id ON public.notification_settings(profile_id);

-- ===========================================
-- SAVED MIXES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.saved_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tobaccos JSONB NOT NULL,
  compatibility_score INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_mixes ENABLE ROW LEVEL SECURITY;

-- Policies for saved_mixes
CREATE POLICY "Users can view own saved mixes" ON public.saved_mixes
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own saved mixes" ON public.saved_mixes
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own saved mixes" ON public.saved_mixes
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own saved mixes" ON public.saved_mixes
  FOR DELETE USING (auth.uid() = profile_id);

-- Indexes for faster queries
CREATE INDEX idx_saved_mixes_profile_id ON public.saved_mixes(profile_id);
CREATE INDEX idx_saved_mixes_is_favorite ON public.saved_mixes(is_favorite);
CREATE INDEX idx_saved_mixes_usage_count ON public.saved_mixes(usage_count DESC);

-- ===========================================
-- GUESTS TABLE (Regular customers with preferences)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  notes TEXT,
  strength_preference TEXT CHECK (strength_preference IN ('light', 'medium', 'strong')),
  flavor_profiles JSONB DEFAULT '[]'::jsonb,
  last_mix_snapshot JSONB, -- Immutable snapshot of last mix for quick repeat
  visit_count INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Policies for guests
CREATE POLICY "Users can view own guests" ON public.guests
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own guests" ON public.guests
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own guests" ON public.guests
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own guests" ON public.guests
  FOR DELETE USING (auth.uid() = profile_id);

-- Indexes for faster queries
CREATE INDEX idx_guests_profile_id ON public.guests(profile_id);
CREATE INDEX idx_guests_last_visit ON public.guests(last_visit_at DESC);
CREATE INDEX idx_guests_visit_count ON public.guests(visit_count DESC);

-- Trigger for guests updated_at
DROP TRIGGER IF EXISTS update_guests_updated_at ON public.guests;
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.notification_settings CASCADE;

CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  low_stock_enabled BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification settings" ON public.notification_settings
  FOR ALL USING (auth.uid() = profile_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SAVED MIXES TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.saved_mixes CASCADE;

CREATE TABLE public.saved_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tobaccos JSONB NOT NULL, -- [{tobacco_id, brand, flavor, percent, color}]
  compatibility_score INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.saved_mixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved mixes" ON public.saved_mixes
  FOR ALL USING (auth.uid() = profile_id);

-- Indexes
CREATE INDEX idx_saved_mixes_profile_id ON public.saved_mixes(profile_id);
CREATE INDEX idx_saved_mixes_is_favorite ON public.saved_mixes(is_favorite);
CREATE INDEX idx_saved_mixes_usage_count ON public.saved_mixes(usage_count DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_saved_mixes_updated_at ON public.saved_mixes;
CREATE TRIGGER update_saved_mixes_updated_at
  BEFORE UPDATE ON public.saved_mixes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MARKETPLACE: SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  delivery_days_min INTEGER DEFAULT 1,
  delivery_days_max INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active suppliers
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MARKETPLACE: SUPPLIER PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  tobacco_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  flavor TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(10,2) NOT NULL,
  package_grams INTEGER DEFAULT 100,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view products
CREATE POLICY "Authenticated users can view supplier products" ON public.supplier_products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_supplier_products_supplier_id ON public.supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_brand ON public.supplier_products(brand);
CREATE INDEX idx_supplier_products_in_stock ON public.supplier_products(in_stock);

-- ============================================================================
-- MARKETPLACE: ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  is_auto_order BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own orders
CREATE POLICY "Users manage own marketplace orders" ON public.marketplace_orders
  FOR ALL USING (auth.uid() = profile_id);

-- Indexes
CREATE INDEX idx_marketplace_orders_profile_id ON public.marketplace_orders(profile_id);
CREATE INDEX idx_marketplace_orders_supplier_id ON public.marketplace_orders(supplier_id);
CREATE INDEX idx_marketplace_orders_status ON public.marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_created_at ON public.marketplace_orders(created_at DESC);

-- ============================================================================
-- MARKETPLACE: ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  supplier_product_id UUID REFERENCES public.supplier_products(id),
  tobacco_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  flavor TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  package_grams INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- RLS
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

-- Users can manage order items through orders
CREATE POLICY "Users manage own order items" ON public.marketplace_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders
      WHERE marketplace_orders.id = marketplace_order_items.order_id
      AND marketplace_orders.profile_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_marketplace_order_items_order_id ON public.marketplace_order_items(order_id);

-- ============================================================================
-- MARKETPLACE: AUTO REORDER RULES TABLE (Enterprise)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auto_reorder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tobacco_inventory_id UUID REFERENCES public.tobacco_inventory(id) ON DELETE CASCADE NOT NULL,
  supplier_product_id UUID REFERENCES public.supplier_products(id) NOT NULL,
  threshold_grams INTEGER NOT NULL,
  reorder_quantity INTEGER NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tobacco_inventory_id)
);

-- RLS
ALTER TABLE public.auto_reorder_rules ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own rules
CREATE POLICY "Users manage own auto reorder rules" ON public.auto_reorder_rules
  FOR ALL USING (auth.uid() = profile_id);

-- Indexes
CREATE INDEX idx_auto_reorder_rules_profile_id ON public.auto_reorder_rules(profile_id);
CREATE INDEX idx_auto_reorder_rules_enabled ON public.auto_reorder_rules(is_enabled);

-- ============================================================================
-- EMAIL SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications_enabled BOOLEAN DEFAULT true,
  low_stock_email BOOLEAN DEFAULT true,
  order_updates_email BOOLEAN DEFAULT true,
  daily_summary_email BOOLEAN DEFAULT false,
  marketing_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own settings
CREATE POLICY "Users manage own email settings" ON public.email_settings
  FOR ALL USING (auth.uid() = profile_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_email_settings_updated_at ON public.email_settings;
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- TELEGRAM CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.telegram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  telegram_user_id BIGINT NOT NULL,
  telegram_username TEXT,
  chat_id BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT true,
  session_reminders BOOLEAN DEFAULT false,
  daily_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own telegram connection
CREATE POLICY "Users manage own telegram connection" ON public.telegram_connections
  FOR ALL USING (auth.uid() = profile_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_telegram_connections_updated_at ON public.telegram_connections;
CREATE TRIGGER update_telegram_connections_updated_at
  BEFORE UPDATE ON public.telegram_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_telegram_connections_chat_id ON public.telegram_connections(chat_id);

-- ============================================================================
-- FLOOR TABLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.floor_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  shape TEXT DEFAULT 'circle' CHECK (shape IN ('circle', 'square', 'rectangle')),
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  width INTEGER DEFAULT 80,
  height INTEGER DEFAULT 80,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  current_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  current_guest_name TEXT,
  session_start_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.floor_tables ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own tables
CREATE POLICY "Users manage own floor tables" ON public.floor_tables
  FOR ALL USING (auth.uid() = profile_id);

-- Index
CREATE INDEX idx_floor_tables_profile_id ON public.floor_tables(profile_id);
CREATE INDEX idx_floor_tables_status ON public.floor_tables(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_floor_tables_updated_at ON public.floor_tables;
CREATE TRIGGER update_floor_tables_updated_at
  BEFORE UPDATE ON public.floor_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
