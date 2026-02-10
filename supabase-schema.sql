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
