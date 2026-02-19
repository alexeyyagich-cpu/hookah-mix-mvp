-- ============================================================================
-- MULTI-TENANT MIGRATION
-- Organization → Location → Members → Data
-- Run in Supabase SQL Editor in order. Each phase is non-breaking.
-- ============================================================================

-- ============================================================================
-- PHASE 1: Create new tables
-- ============================================================================

-- 1a. Organizations table (top-level tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 1b. Locations table (venues within an org)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  address TEXT,
  phone TEXT,
  locale TEXT DEFAULT 'ru',
  timezone TEXT DEFAULT 'Europe/Berlin',
  active_modules TEXT[] DEFAULT ARRAY['hookah'],
  business_type TEXT CHECK (business_type IN ('hookah', 'bar', 'hookah_bar', 'restaurant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 1c. Organization members (user→org→role mapping)
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'hookah_master', 'bartender', 'cook')),
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 1d. Invite tokens (replaces staff_invitations)
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'hookah_master', 'bartender', 'cook')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_locations_org ON public.locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.org_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON public.invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_org ON public.invite_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON public.invite_tokens(email);

-- updated_at triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_members_updated_at ON public.org_members;
CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PHASE 1b: Helper function for RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND is_active = true
    ),
    ARRAY[]::UUID[]
  )
$$;

-- ============================================================================
-- PHASE 1c: RLS policies for new tables
-- ============================================================================

-- Organizations: members can view their org
CREATE POLICY "Members can view own org" ON public.organizations
  FOR SELECT USING (id = ANY(public.user_org_ids()));

-- Only owners can update org
CREATE POLICY "Owners can update org" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.organization_id = organizations.id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
        AND org_members.is_active = true
    )
  );

-- Anyone can insert org (on signup)
CREATE POLICY "Users can create org" ON public.organizations
  FOR INSERT WITH CHECK (true);

-- Locations: members can view locations in their org
CREATE POLICY "Members can view locations" ON public.locations
  FOR SELECT USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "Owners can manage locations" ON public.locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.organization_id = locations.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
        AND org_members.is_active = true
    )
  );

-- Org members: members can view team, owners can manage
CREATE POLICY "Members can view team" ON public.org_members
  FOR SELECT USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "Owners can manage team" ON public.org_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = org_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.is_active = true
    )
  );

-- Allow users to insert their own membership (for invite acceptance)
CREATE POLICY "Users can accept invites" ON public.org_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Invite tokens: owners can manage, anyone can read by token
CREATE POLICY "Owners manage invites" ON public.invite_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.organization_id = invite_tokens.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'owner'
        AND org_members.is_active = true
    )
  );

CREATE POLICY "Anyone can read invite by token" ON public.invite_tokens
  FOR SELECT USING (true);

-- ============================================================================
-- PHASE 2: Backfill existing data
-- ============================================================================

-- 2a. Create organization for each owner profile
INSERT INTO public.organizations (name, slug, logo_url, subscription_tier, subscription_expires_at, stripe_customer_id, stripe_subscription_id)
SELECT
  COALESCE(p.business_name, 'My Venue'),
  p.venue_slug,
  p.logo_url,
  COALESCE(p.subscription_tier, 'free'),
  p.subscription_expires_at,
  p.stripe_customer_id,
  p.stripe_subscription_id
FROM public.profiles p
WHERE p.role = 'owner'
ON CONFLICT (slug) DO NOTHING;

-- 2b. Create default location for each organization
INSERT INTO public.locations (organization_id, name, address, phone, active_modules, business_type)
SELECT
  o.id,
  COALESCE(p.business_name, 'Main'),
  p.address,
  p.phone,
  COALESCE(p.active_modules::TEXT[], ARRAY['hookah']),
  p.business_type
FROM public.profiles p
JOIN public.organizations o ON (
  (o.slug IS NOT NULL AND o.slug = p.venue_slug)
  OR (o.slug IS NULL AND o.name = COALESCE(p.business_name, 'My Venue'))
)
WHERE p.role = 'owner';

-- 2c. Create org_members for owners
INSERT INTO public.org_members (organization_id, user_id, role, display_name)
SELECT
  o.id,
  p.id,
  'owner',
  p.owner_name
FROM public.profiles p
JOIN public.organizations o ON (
  (o.slug IS NOT NULL AND o.slug = p.venue_slug)
  OR (o.slug IS NULL AND o.name = COALESCE(p.business_name, 'My Venue'))
)
WHERE p.role = 'owner'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 2d. Create org_members for existing staff
INSERT INTO public.org_members (organization_id, user_id, role, display_name)
SELECT
  owner_om.organization_id,
  p.id,
  'hookah_master',
  p.owner_name
FROM public.profiles p
JOIN public.org_members owner_om ON owner_om.user_id = p.owner_profile_id AND owner_om.role = 'owner'
WHERE p.role = 'staff'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================================================
-- PHASE 3: Add organization_id + location_id columns to data tables
-- ============================================================================

-- Location-scoped tables (org_id + loc_id)
ALTER TABLE public.tobacco_inventory ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tobacco_inventory ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.bowl_types ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.bowl_types ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.bar_inventory ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.bar_inventory ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.bar_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.bar_transactions ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.bar_sales ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.bar_sales ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.kds_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.kds_orders ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.floor_tables ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.floor_tables ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.r2o_connections ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.r2o_connections ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.r2o_product_mappings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.r2o_product_mappings ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

ALTER TABLE public.r2o_sales_log ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.r2o_sales_log ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Org-scoped tables (org_id only)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.bar_recipes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.auto_reorder_rules ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- ============================================================================
-- PHASE 4: Backfill organization_id + location_id on existing data
-- ============================================================================

-- Helper: backfill org_id and loc_id for owner-created data
-- For each table, we join profile_id → org_members to find the org
-- Then pick the first location in that org

-- tobacco_inventory
UPDATE public.tobacco_inventory t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- bowl_types
UPDATE public.bowl_types t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- sessions
UPDATE public.sessions t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- inventory_transactions
UPDATE public.inventory_transactions t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- bar_inventory
UPDATE public.bar_inventory t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- bar_transactions
UPDATE public.bar_transactions t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- bar_sales
UPDATE public.bar_sales t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- kds_orders
UPDATE public.kds_orders t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- floor_tables
UPDATE public.floor_tables t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- reviews
UPDATE public.reviews t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- reservations
UPDATE public.reservations t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- r2o_connections
UPDATE public.r2o_connections t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- r2o_product_mappings
UPDATE public.r2o_product_mappings t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- r2o_sales_log
UPDATE public.r2o_sales_log t
SET organization_id = om.organization_id,
    location_id = (SELECT id FROM public.locations WHERE organization_id = om.organization_id LIMIT 1)
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- Org-scoped tables (org_id only)
UPDATE public.guests t
SET organization_id = om.organization_id
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

UPDATE public.bar_recipes t
SET organization_id = om.organization_id
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

UPDATE public.marketplace_orders t
SET organization_id = om.organization_id
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

UPDATE public.auto_reorder_rules t
SET organization_id = om.organization_id
FROM public.org_members om
WHERE om.user_id = t.profile_id AND t.organization_id IS NULL;

-- ============================================================================
-- PHASE 5: Create indexes on new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tobacco_inventory_org ON public.tobacco_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_bowl_types_org ON public.bowl_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON public.sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_org ON public.inventory_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bar_inventory_org ON public.bar_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_bar_transactions_org ON public.bar_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bar_sales_org ON public.bar_sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_kds_orders_org ON public.kds_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_floor_tables_org ON public.floor_tables(organization_id);
CREATE INDEX IF NOT EXISTS idx_reviews_org ON public.reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_org ON public.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_r2o_connections_org ON public.r2o_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_r2o_product_mappings_org ON public.r2o_product_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_r2o_sales_log_org ON public.r2o_sales_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_guests_org ON public.guests(organization_id);
CREATE INDEX IF NOT EXISTS idx_bar_recipes_org ON public.bar_recipes(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_org ON public.marketplace_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_auto_reorder_rules_org ON public.auto_reorder_rules(organization_id);

-- ============================================================================
-- PHASE 6: Update RLS policies (replace profile_id with org-based)
-- ============================================================================

-- TOBACCO INVENTORY
DROP POLICY IF EXISTS "Users can view own inventory" ON public.tobacco_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.tobacco_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.tobacco_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.tobacco_inventory;

CREATE POLICY "org_access" ON public.tobacco_inventory
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- BOWL TYPES
DROP POLICY IF EXISTS "Users can view own bowls" ON public.bowl_types;
DROP POLICY IF EXISTS "Users can insert own bowls" ON public.bowl_types;
DROP POLICY IF EXISTS "Users can update own bowls" ON public.bowl_types;
DROP POLICY IF EXISTS "Users can delete own bowls" ON public.bowl_types;

CREATE POLICY "org_access" ON public.bowl_types
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- SESSIONS
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

CREATE POLICY "org_access" ON public.sessions
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- SESSION ITEMS (access via parent session)
DROP POLICY IF EXISTS "Users can view own session items" ON public.session_items;
DROP POLICY IF EXISTS "Users can insert own session items" ON public.session_items;
DROP POLICY IF EXISTS "Users can update own session items" ON public.session_items;
DROP POLICY IF EXISTS "Users can delete own session items" ON public.session_items;

CREATE POLICY "access_via_session" ON public.session_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_items.session_id
        AND sessions.organization_id = ANY(public.user_org_ids())
    )
  );

-- INVENTORY TRANSACTIONS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.inventory_transactions;

CREATE POLICY "org_access" ON public.inventory_transactions
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- GUESTS
DROP POLICY IF EXISTS "Users can view own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can insert own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can update own guests" ON public.guests;
DROP POLICY IF EXISTS "Users can delete own guests" ON public.guests;

CREATE POLICY "org_access" ON public.guests
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- BAR INVENTORY
DROP POLICY IF EXISTS "Users manage own bar inventory" ON public.bar_inventory;

CREATE POLICY "org_access" ON public.bar_inventory
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- BAR TRANSACTIONS
DROP POLICY IF EXISTS "Users manage own bar transactions" ON public.bar_transactions;

CREATE POLICY "org_access" ON public.bar_transactions
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- BAR RECIPES
DROP POLICY IF EXISTS "Users manage own bar recipes" ON public.bar_recipes;

CREATE POLICY "org_access" ON public.bar_recipes
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- BAR RECIPE INGREDIENTS (access via parent recipe)
DROP POLICY IF EXISTS "Users manage own recipe ingredients" ON public.bar_recipe_ingredients;

CREATE POLICY "access_via_recipe" ON public.bar_recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bar_recipes
      WHERE bar_recipes.id = bar_recipe_ingredients.recipe_id
        AND bar_recipes.organization_id = ANY(public.user_org_ids())
    )
  );

-- BAR SALES
DROP POLICY IF EXISTS "Users manage own bar sales" ON public.bar_sales;

CREATE POLICY "org_access" ON public.bar_sales
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- KDS ORDERS
DROP POLICY IF EXISTS "Users manage own kds_orders" ON public.kds_orders;

CREATE POLICY "org_access" ON public.kds_orders
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- FLOOR TABLES
DROP POLICY IF EXISTS "Users manage own floor tables" ON public.floor_tables;

CREATE POLICY "org_access" ON public.floor_tables
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- MARKETPLACE ORDERS
DROP POLICY IF EXISTS "Users manage own marketplace orders" ON public.marketplace_orders;

CREATE POLICY "org_access" ON public.marketplace_orders
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- MARKETPLACE ORDER ITEMS (access via parent order)
DROP POLICY IF EXISTS "Users manage own order items" ON public.marketplace_order_items;

CREATE POLICY "access_via_order" ON public.marketplace_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders
      WHERE marketplace_orders.id = marketplace_order_items.order_id
        AND marketplace_orders.organization_id = ANY(public.user_org_ids())
    )
  );

-- AUTO REORDER RULES
DROP POLICY IF EXISTS "Users manage own auto reorder rules" ON public.auto_reorder_rules;

CREATE POLICY "org_access" ON public.auto_reorder_rules
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- REVIEWS (keep public policies, add org-based owner access)
DROP POLICY IF EXISTS "Owners view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Owners update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Owners delete own reviews" ON public.reviews;

CREATE POLICY "org_view_reviews" ON public.reviews
  FOR SELECT USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "org_update_reviews" ON public.reviews
  FOR UPDATE USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "org_delete_reviews" ON public.reviews
  FOR DELETE USING (organization_id = ANY(public.user_org_ids()));

-- RESERVATIONS (keep public policies, add org-based owner access)
DROP POLICY IF EXISTS "Owners view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Owners update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Owners delete own reservations" ON public.reservations;

CREATE POLICY "org_view_reservations" ON public.reservations
  FOR SELECT USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "org_update_reservations" ON public.reservations
  FOR UPDATE USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "org_delete_reservations" ON public.reservations
  FOR DELETE USING (organization_id = ANY(public.user_org_ids()));

-- R2O CONNECTIONS
DROP POLICY IF EXISTS "Users manage own r2o connection" ON public.r2o_connections;

CREATE POLICY "org_access" ON public.r2o_connections
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- R2O PRODUCT MAPPINGS
DROP POLICY IF EXISTS "Users manage own r2o product mappings" ON public.r2o_product_mappings;

CREATE POLICY "org_access" ON public.r2o_product_mappings
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- R2O SALES LOG
DROP POLICY IF EXISTS "Users manage own r2o sales log" ON public.r2o_sales_log;

CREATE POLICY "org_access" ON public.r2o_sales_log
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

-- PROFILES: allow org members to see each other's profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR id IN (
      SELECT om.user_id FROM public.org_members om
      WHERE om.organization_id = ANY(public.user_org_ids()) AND om.is_active = true
    )
  );

-- ============================================================================
-- PHASE 7: Update handle_new_user trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  loc_id UUID;
  biz_name TEXT;
BEGIN
  biz_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Venue');

  -- Create profile
  INSERT INTO public.profiles (id, business_name, owner_name)
  VALUES (
    NEW.id,
    biz_name,
    NEW.raw_user_meta_data->>'owner_name'
  );

  -- Create organization
  INSERT INTO public.organizations (name)
  VALUES (biz_name)
  RETURNING id INTO org_id;

  -- Create default location
  INSERT INTO public.locations (organization_id, name)
  VALUES (org_id, biz_name)
  RETURNING id INTO loc_id;

  -- Create owner membership
  INSERT INTO public.org_members (organization_id, user_id, role, display_name)
  VALUES (org_id, NEW.id, 'owner', NEW.raw_user_meta_data->>'owner_name');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 8 (LATER): Make NOT NULL after frontend is updated
-- ============================================================================
-- ALTER TABLE public.tobacco_inventory ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE public.tobacco_inventory ALTER COLUMN location_id SET NOT NULL;
-- ... repeat for all tables
-- DROP TABLE public.staff_invitations;
