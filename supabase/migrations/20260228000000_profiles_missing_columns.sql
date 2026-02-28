-- =============================================================================
-- Add missing columns to profiles table
-- =============================================================================
-- These columns were referenced in the AuthContext fetchProfile query
-- but only existed on the locations table. Adding them to profiles
-- ensures the profile fetch works correctly.

BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_type TEXT
  CHECK (business_type IN ('hookah', 'bar', 'hookah_bar', 'restaurant'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_modules TEXT[]
  DEFAULT ARRAY['hookah'];

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'ru';

COMMIT;
