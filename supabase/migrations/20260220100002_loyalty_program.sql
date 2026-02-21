-- Add loyalty fields to guests table
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS bonus_balance DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze';

-- Loyalty settings per profile
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_accrual_percent DECIMAL DEFAULT 5,
  bonus_max_redemption_percent DECIMAL DEFAULT 30,
  tier_silver_threshold DECIMAL DEFAULT 500,
  tier_gold_threshold DECIMAL DEFAULT 2000,
  tier_silver_discount DECIMAL DEFAULT 5,
  tier_gold_discount DECIMAL DEFAULT 10,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loyalty settings"
  ON loyalty_settings FOR ALL
  USING (profile_id = auth.uid());

-- Bonus transactions log
CREATE TABLE IF NOT EXISTS bonus_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('accrual', 'redemption', 'manual')),
  amount DECIMAL NOT NULL,
  balance_after DECIMAL NOT NULL DEFAULT 0,
  related_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE bonus_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bonus transactions"
  ON bonus_transactions FOR ALL
  USING (profile_id = auth.uid());

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_bonus_transactions_guest ON bonus_transactions(guest_id);
CREATE INDEX IF NOT EXISTS idx_bonus_transactions_profile ON bonus_transactions(profile_id);
