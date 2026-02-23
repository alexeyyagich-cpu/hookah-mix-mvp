-- ============================================================
-- LOUNGE PROFILES TABLE + SETUP ORGANIZATION RPC
-- Supports: Fix C1 (Lounge Persistence) + Fix M8 (Onboarding Org)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. LOUNGE PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lounge_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Identity
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Images
  logo_url TEXT,
  cover_image_url TEXT,

  -- Location
  city TEXT,
  address TEXT,

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  telegram TEXT,

  -- Hours & features
  working_hours JSONB,
  features TEXT[] DEFAULT '{}',

  -- Display settings
  is_published BOOLEAN DEFAULT false,
  show_menu BOOLEAN DEFAULT true,
  show_prices BOOLEAN DEFAULT true,
  show_popular_mixes BOOLEAN DEFAULT true,

  -- Social links (extensible)
  social_links JSONB DEFAULT '{}',

  -- Computed stats (updated by trigger)
  rating NUMERIC(2,1),
  reviews_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT lounge_slug_unique UNIQUE(slug),
  CONSTRAINT lounge_one_per_org UNIQUE(organization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lounge_profiles_profile ON public.lounge_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_lounge_profiles_org ON public.lounge_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_lounge_profiles_slug ON public.lounge_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_lounge_profiles_city ON public.lounge_profiles(city) WHERE is_published = true;

-- Enable RLS
ALTER TABLE public.lounge_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (per-operation)
-- ============================================================

-- Public read for published lounges (anyone, including anonymous)
CREATE POLICY "lounge_public_read"
  ON public.lounge_profiles FOR SELECT
  USING (is_published = true);

-- Owner/org member read for unpublished (drafts)
CREATE POLICY "lounge_member_read"
  ON public.lounge_profiles FOR SELECT
  USING (
    profile_id = auth.uid()
    OR organization_id = ANY(public.user_org_ids())
  );

-- Owner can insert their own lounge
CREATE POLICY "lounge_insert"
  ON public.lounge_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Owner/manager can update
CREATE POLICY "lounge_update"
  ON public.lounge_profiles FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
    )
  );

-- Only owner can delete
CREATE POLICY "lounge_delete"
  ON public.lounge_profiles FOR DELETE
  USING (profile_id = auth.uid());

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.lounge_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lounge_profiles_updated_at
  BEFORE UPDATE ON public.lounge_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.lounge_profiles_updated_at();

-- ============================================================
-- 2. SETUP ORGANIZATION RPC (Idempotent, Atomic)
-- Called by onboarding finishOnboarding() and setup banner
-- ============================================================

CREATE OR REPLACE FUNCTION public.setup_organization(
  p_name TEXT,
  p_type TEXT,
  p_slug TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_loc_id UUID;
  v_lounge_id UUID;
  v_existing_org_id UUID;
  v_org_slug TEXT;
  v_lounge_slug TEXT;
  v_venue_slug TEXT;
  v_modules TEXT[];
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- =========================================================
  -- IDEMPOTENCY CHECK: Does user already own an org?
  -- =========================================================
  SELECT om.organization_id INTO v_existing_org_id
  FROM public.org_members om
  WHERE om.user_id = v_user_id
    AND om.role = 'owner'
    AND om.is_active = true
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'organization_id', v_existing_org_id,
      'already_existed', true
    );
  END IF;

  -- =========================================================
  -- Generate org slug from name
  -- =========================================================
  v_org_slug := lower(regexp_replace(TRIM(COALESCE(p_name, 'my-lounge')), '[^a-z0-9]+', '-', 'gi'));
  -- Remove leading/trailing dashes
  v_org_slug := TRIM(BOTH '-' FROM v_org_slug);
  IF v_org_slug = '' THEN
    v_org_slug := 'lounge';
  END IF;

  -- Ensure uniqueness
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) THEN
    v_org_slug := v_org_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;

  -- =========================================================
  -- Determine active modules from business type
  -- =========================================================
  v_modules := CASE p_type
    WHEN 'hookah' THEN ARRAY['hookah']
    WHEN 'bar' THEN ARRAY['bar']
    WHEN 'hookah_bar' THEN ARRAY['hookah', 'bar']
    WHEN 'restaurant' THEN ARRAY['bar']
    ELSE ARRAY['hookah']
  END;

  -- =========================================================
  -- 1. Create organization
  -- =========================================================
  INSERT INTO public.organizations (name, slug, subscription_tier)
  VALUES (COALESCE(NULLIF(TRIM(p_name), ''), 'My Lounge'), v_org_slug, 'free')
  RETURNING id INTO v_org_id;

  -- =========================================================
  -- 2. Create default location
  -- =========================================================
  INSERT INTO public.locations (
    organization_id, name, slug, business_type,
    active_modules, locale, timezone
  )
  VALUES (
    v_org_id,
    COALESCE(NULLIF(TRIM(p_name), ''), 'My Lounge'),
    'main',
    COALESCE(p_type, 'hookah_bar'),
    v_modules,
    'ru',
    'Europe/Berlin'
  )
  RETURNING id INTO v_loc_id;

  -- =========================================================
  -- 3. Create org membership (owner)
  -- =========================================================
  INSERT INTO public.org_members (
    organization_id, location_id, user_id, role,
    display_name, is_active
  )
  VALUES (
    v_org_id, v_loc_id, v_user_id, 'owner',
    COALESCE(NULLIF(TRIM(p_name), ''), 'Owner'), true
  );

  -- =========================================================
  -- 4. Create lounge profile (draft, not published)
  -- =========================================================

  -- Derive lounge slug from venue_slug on profile, or from p_slug, or from org slug
  SELECT venue_slug INTO v_venue_slug
  FROM public.profiles
  WHERE id = v_user_id;

  v_lounge_slug := COALESCE(
    NULLIF(TRIM(p_slug), ''),
    NULLIF(TRIM(v_venue_slug), ''),
    v_org_slug
  );

  -- Ensure lounge slug uniqueness
  IF EXISTS (SELECT 1 FROM public.lounge_profiles WHERE slug = v_lounge_slug) THEN
    v_lounge_slug := v_lounge_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;

  INSERT INTO public.lounge_profiles (
    profile_id, organization_id, slug, name, is_published
  )
  VALUES (
    v_user_id, v_org_id, v_lounge_slug,
    COALESCE(NULLIF(TRIM(p_name), ''), 'My Lounge'),
    false
  )
  RETURNING id INTO v_lounge_id;

  -- =========================================================
  -- Return created IDs
  -- =========================================================
  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'location_id', v_loc_id,
    'lounge_id', v_lounge_id,
    'slug', v_lounge_slug,
    'already_existed', false
  );
END;
$$;

COMMIT;
