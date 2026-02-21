-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('happy_hour', 'nth_free', 'birthday', 'custom_discount')),
  rules JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own promotions"
  ON promotions FOR ALL
  USING (profile_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_promotions_profile ON promotions(profile_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(profile_id, is_active);
