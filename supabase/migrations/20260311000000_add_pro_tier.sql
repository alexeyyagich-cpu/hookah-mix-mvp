-- Add 'pro' value to subscription_tier enum
-- Pro = Core + CRM + waiter tablet + financial reports, but single location
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'pro' AFTER 'core';
