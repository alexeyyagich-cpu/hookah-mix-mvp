-- Add payroll columns to org_members
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL DEFAULT 0;
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS sales_commission_percent DECIMAL DEFAULT 0;
