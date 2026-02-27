-- =============================================================================
-- Pricing Restructure: free/pro/enterprise → trial/core/multi/enterprise
-- =============================================================================
-- Context: HookahTorus repositioning to B2B vertical SaaS (DACH market).
-- No active subscribers — clean migration.

BEGIN;

-- =========================================================================
-- 1. Add trial_expires_at columns
-- =========================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- =========================================================================
-- 2. Migrate existing tier values BEFORE changing constraints
-- =========================================================================
UPDATE profiles SET subscription_tier = 'trial' WHERE subscription_tier = 'free';
UPDATE profiles SET subscription_tier = 'core' WHERE subscription_tier = 'pro';
UPDATE profiles SET subscription_tier = 'multi' WHERE subscription_tier = 'enterprise';

UPDATE organizations SET subscription_tier = 'trial' WHERE subscription_tier = 'free';
UPDATE organizations SET subscription_tier = 'core' WHERE subscription_tier = 'pro';
UPDATE organizations SET subscription_tier = 'multi' WHERE subscription_tier = 'enterprise';

-- =========================================================================
-- 3. Drop old CHECK constraints and add new ones
-- =========================================================================

-- profiles table: find and drop the constraint, then add new one
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the CHECK constraint on profiles.subscription_tier
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE con.conrelid = 'public.profiles'::regclass
    AND att.attname = 'subscription_tier'
    AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', constraint_name);
  END IF;
END
$$;

ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'core', 'multi', 'enterprise'));

-- organizations table: same approach
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE con.conrelid = 'public.organizations'::regclass
    AND att.attname = 'subscription_tier'
    AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE organizations DROP CONSTRAINT %I', constraint_name);
  END IF;
END
$$;

ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'core', 'multi', 'enterprise'));

-- =========================================================================
-- 4. Update default values
-- =========================================================================
ALTER TABLE profiles ALTER COLUMN subscription_tier SET DEFAULT 'trial';
ALTER TABLE organizations ALTER COLUMN subscription_tier SET DEFAULT 'trial';

-- =========================================================================
-- 5. Set trial_expires_at for existing trial users (14 days from now)
-- =========================================================================
UPDATE profiles
SET trial_expires_at = NOW() + INTERVAL '14 days'
WHERE subscription_tier = 'trial' AND trial_expires_at IS NULL;

UPDATE organizations
SET trial_expires_at = NOW() + INTERVAL '14 days'
WHERE subscription_tier = 'trial' AND trial_expires_at IS NULL;

-- =========================================================================
-- 6. Update setup_organization RPC to provision trial with expiry
-- =========================================================================
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
  v_org_slug := TRIM(BOTH '-' FROM v_org_slug);
  IF v_org_slug = '' THEN
    v_org_slug := 'lounge';
  END IF;

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
  -- 1. Create organization with 14-day trial
  -- =========================================================
  INSERT INTO public.organizations (name, slug, subscription_tier, trial_expires_at)
  VALUES (
    COALESCE(NULLIF(TRIM(p_name), ''), 'My Lounge'),
    v_org_slug,
    'trial',
    NOW() + INTERVAL '14 days'
  )
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
  SELECT venue_slug INTO v_venue_slug
  FROM public.profiles
  WHERE id = v_user_id;

  v_lounge_slug := COALESCE(
    NULLIF(TRIM(p_slug), ''),
    NULLIF(TRIM(v_venue_slug), ''),
    v_org_slug
  );

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
  -- 5. Set trial on the user's profile too
  -- =========================================================
  UPDATE public.profiles
  SET subscription_tier = 'trial',
      trial_expires_at = NOW() + INTERVAL '14 days'
  WHERE id = v_user_id
    AND (subscription_tier = 'trial' OR subscription_tier IS NULL);

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
