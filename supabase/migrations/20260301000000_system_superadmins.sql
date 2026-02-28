-- System superadmins table for platform-level admin access
-- These users can see all organizations, manage subscriptions, impersonate users

CREATE TABLE IF NOT EXISTS public.system_superadmins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_superadmins ENABLE ROW LEVEL SECURITY;

-- Superadmins can only read their own row (to check if they are superadmin)
CREATE POLICY "superadmin_read_self" ON public.system_superadmins
  FOR SELECT USING (user_id = auth.uid());

-- Helper function for RLS and app-level checks
CREATE OR REPLACE FUNCTION public.is_system_superadmin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_superadmins
    WHERE user_id = auth.uid()
  )
$$;

-- Seed: product owner
INSERT INTO public.system_superadmins (user_id)
VALUES ('fca55a59-38c0-4ff7-894a-3251d012664e')
ON CONFLICT (user_id) DO NOTHING;
