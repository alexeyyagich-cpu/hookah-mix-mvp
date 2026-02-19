-- Multi-tenant architecture: Organizations, Locations, Members, Invite Tokens


-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

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

-- ============================================================================
-- LOCATIONS
-- ============================================================================

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

-- ============================================================================
-- ORG MEMBERS
-- ============================================================================

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

-- ============================================================================
-- INVITE TOKENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'hookah_master', 'bartender', 'cook')),
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION FOR RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS UUID[]
LANGUAGE sql SECURITY DEFINER STABLE
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
-- RLS POLICIES
-- ============================================================================

CREATE POLICY "org_members_access" ON public.org_members
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "org_access" ON public.organizations
  FOR ALL USING (id = ANY(public.user_org_ids()));

CREATE POLICY "location_access" ON public.locations
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "invite_access" ON public.invite_tokens
  FOR ALL USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "invite_accept" ON public.invite_tokens
  FOR SELECT USING (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.org_members(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_org ON public.locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON public.invite_tokens(token) WHERE accepted_at IS NULL;
