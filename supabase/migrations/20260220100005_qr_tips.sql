-- Staff profiles for tipping
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_member_id UUID REFERENCES org_members(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  tip_slug TEXT UNIQUE NOT NULL,
  is_tip_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tips received
CREATE TABLE IF NOT EXISTS tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_profile_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payer_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Staff profiles: owner manages, public reads by slug
CREATE POLICY "Users can manage own staff profiles"
  ON staff_profiles FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Public can read staff profiles by slug"
  ON staff_profiles FOR SELECT
  USING (is_tip_enabled = true);

-- Tips: staff can read their own
CREATE POLICY "Staff can view own tips"
  ON tips FOR SELECT
  USING (staff_profile_id IN (
    SELECT id FROM staff_profiles WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert tips"
  ON tips FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_slug ON staff_profiles(tip_slug);
CREATE INDEX IF NOT EXISTS idx_tips_staff ON tips(staff_profile_id);
