-- Add 'pro' value to subscription_tier CHECK constraints
-- Pro = Core + CRM + waiter tablet + financial reports, but single location

-- Update profiles constraint to include 'pro'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'core', 'pro', 'multi', 'enterprise'));

-- Update organizations constraint to include 'pro'
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'core', 'pro', 'multi', 'enterprise'));
