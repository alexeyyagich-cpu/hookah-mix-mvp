-- Fix onboarding_step CHECK constraint to match new step values in the app code
-- Old constraint: ('welcome', 'business', 'bowl', 'tobacco', 'complete')
-- New constraint: adds 'business_type' and 'setup' while keeping old values for backward compat

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_onboarding_step_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_onboarding_step_check
  CHECK (onboarding_step IN ('welcome', 'business_type', 'business', 'setup', 'complete', 'bowl', 'tobacco'));
